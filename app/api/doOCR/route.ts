import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import os from "os";
import path from "path";
import fs from 'fs';
import http from 'http';
import https from 'https';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro-exp-03-25",
    systemInstruction: "You are an AI system designed to parse and format prescription information into a structured JSON format. Your task is to analyze prescription text and generate a standardized representation that includes detailed medication information and patient symptoms.\nInput Format\n\nYou will receive prescription image.\nOutput Format\n\nTransform the prescription information into the following JSON structure:\n{\n  \"meds\": [\n    {\n      \"name\": \"MEDICATION_NAME\",\n      \"description\": \"DOSAGE_INSTRUCTIONS\",\n      \"eat_for\": \"DURATION\",\n      \"times_to_eat\": [\"TIME1\", \"TIME2\", ...],\n      \"uses\": \"MEDICATION_PURPOSE\",\n      \"side_effect\": [\"SIDE_EFFECT1\", \"SIDE_EFFECT2\", ...]\n    }\n  ],\n  \"symptoms\": [\n    {\n      \"name\": \"SYMPTOM_NAME\",\n      \"startDate\": \"YYYY-MM-DD\"\n    }\n  ]\n}\nField Specifications\nMedications (meds):\n\n    name: The full name of the medication including strength if specified (e.g., \"Pan-D\")\n    description: The complete dosage instruction with how to eat(before or after or with or without food) (e.g., \"4 mL every 6 hours after meal\"/\"when needed with food\")\n    eat_for: Duration of medication course in days (e.g., \"3\" for 3 days, \"null\" if not specified or as needed)\n    times_to_eat: Array of specific times for medication in 24-hour format (e.g., [\"0800\", \"1600\", \"2400\"])(p.s. Start from 0800)\n    uses: The medical purpose or indication for the medication\n    side_effect: Array of common side effects associated with the medication\n\nSymptoms:\n\n    name: The name of the diagnosed condition or symptom\n    startDate: The date when symptoms began or when diagnosis was made (YYYY-MM-DD format)\n\nGuidelines:\n\n    Maintain consistency in time format as 24-hour notation with leading zeros (e.g., \"0600\" not \"6:00\" or \"6 AM\")\n    For description, add before meal or after meal (Dont use Short Form like TDS,SOS instead Write \"thrice a day\" ,\"when neeed\")\n    For duration, use the format \"X\" where X is the number of days\n    For medications with \"as needed\" instructions, set eat_for to \"null\"\n    Include all common side effects for each medication based on medical reference data\n    If specific times aren't provided in the prescription, infer appropriate timing based on frequency (e.g., \"three times a day\" might be [\"0800\", \"1600\", \"2400\"])\n    Include strength information in the medication name when provided\n",
});

const generationConfig = {
    temperature: 0,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 65536,
    responseModalities: [
    ],
    responseMimeType: "application/json",
    responseSchema: {
        type: "object",
        properties: {
            symptoms: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string"
                        },
                        startDate: {
                            type: "string"
                        }
                    },
                    required: [
                        "name",
                        "startDate"
                    ]
                }
            },
            meds: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string"
                        },
                        description: {
                            type: "string"
                        },
                        eat_for: {
                            type: "string"
                        },
                        times_to_eat: {
                            type: "array",
                            items: {
                                type: "string"
                            }
                        },
                        uses: {
                            type: "string"
                        },
                        side_effect: {
                            type: "array",
                            items: {
                                type: "string"
                            }
                        }
                    },
                    required: [
                        "name",
                        "description",
                        "eat_for",
                        "times_to_eat",
                        "uses",
                        "side_effect"
                    ]
                }
            }
        },
        required: [
            "symptoms",
            "meds"
        ]
    },
};
async function uploadToGemini(url: string, mimeType: any) {
    return new Promise((resolve, reject) => {
      try {
        // Extract filename from URL
        const fileName = path.basename(url);
        const tempDir = path.join(os.tmpdir(), 'med-aid-temp');
        const tempFilePath = path.join(tempDir, fileName);
        
        // Create temp directory if it doesn't exist
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Determine whether to use http or https
        const httpClient = url.startsWith('https') ? https : http;
        
        console.log(`Downloading file from ${url}...`);
        
        // Download file from URL
        const fileStream = fs.createWriteStream(tempFilePath);
        
        httpClient.get(url, (response) => {
          // Handle redirects
          if (response.statusCode === 301 || response.statusCode === 302) {
            fs.unlinkSync(tempFilePath);
            if (response.headers.location) {
              uploadToGemini(response.headers.location, mimeType)
                .then(resolve)
                .catch(reject);
            } else {
              reject(new Error("Redirect location header is missing"));
            }
            return;
          }
          
          response.pipe(fileStream);
          
          fileStream.on('finish', async () => {
            fileStream.close();
            console.log(`File saved temporarily to ${tempFilePath}`);
            
            try {
              // Upload to Google
              const uploadResult = await fileManager.uploadFile(tempFilePath, {
                mimeType,
                displayName: fileName,
              });
              
              const file = uploadResult.file;
              console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
              console.log("Full uploaded file object:", file);
              
              // Clean up temp file
              fs.unlinkSync(tempFilePath);
              console.log(`Temporary file removed`);
              
              resolve(file);
            } catch (error) {
              reject(error);
            }
          });
        }).on('error', (error) => {
          fs.unlinkSync(tempFilePath);
          reject(error);
        });
        
      } catch (error) {
        console.error("Error uploading file from URL:", error);
        reject(error);
      }
    });
}
  
export async function POST(req: NextRequest) {
    try {
      // Extract image from request
      const { image } = await req.json();
      console.log("Received image:", image);
      if (!image) {
        return NextResponse.json(
          { error: "No image provided" },
          { status: 400 }
        );
      }
     
      // Upload file to Gemini
      const file = await uploadToGemini(image, "image/jpeg");
      
      // Start chat session and log its configuration
      console.log("Starting chat session with generationConfig:", generationConfig);
      const chatSession = model.startChat({
          // @ts-ignore
          generationConfig,
          history: [],
      });
  
      // Log the fileUri being sent
      console.log("Sending message with fileData:", {
        // @ts-ignore
        fileUri: file.name,
        mimeType: "image/jpeg"
      });
      
      // Fixed message format for Gemini API
      const result = await chatSession.sendMessage([
          {
              fileData: {
                // @ts-ignore
                  fileUri: file.name,
                  mimeType: "image/jpeg"
              }
          }
      ]);
  
      console.log("Result from chatSession.sendMessage:", result);
      
      // Extract and parse response
      const responseText = result.response.text();
      console.log("Received response from Gemini:", responseText);
  
      // Try to parse response as JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (error) {
        console.error("Failed to parse Gemini response as JSON:", error);
        parsedResponse = { rawText: responseText };
      }
  
      return NextResponse.json(parsedResponse, { status: 200 });
      
    } catch (error:any) {
      console.error("Error processing image:", error);
      return NextResponse.json(
        { error: "Internal Server Error", details: error.message },
        { status: 500 }
      );
    }
}