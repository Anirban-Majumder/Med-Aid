import { NextRequest, NextResponse } from 'next/server';

function convertImageToBase64(src: any): Promise<string> {
  return new Promise((resolve, reject) => {
    // If the source is already a Base64 data URL, return it directly.
    if (src.startsWith("data:")) {
      resolve(src);
      return;
    }
    fetch(src)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        const contentType = blob.type || "image/jpeg";
        blob.arrayBuffer().then((buffer) => {
          const base64 = Buffer.from(buffer).toString("base64");
          resolve(`data:${contentType};base64,${base64}`);
        });
      })
      .catch((error) => reject(error));
  });
}

export async function POST(req: NextRequest) { 
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const payload = {
      messages: [
        { role: "assistant", content: "" },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are a medical assistant AI specialized in converting prescription images into structured JSON data. Your input will be an image of a prescription (handwritten or printed). First, use OCR to extract the text from the image, then parse the text to identify each medicine. For every medicine, output a JSON object with exactly two keys 'symptom' which will be a string with made up of all the symptom-date_of_prescription(YYYY-MM-DD) seperated by comma and 'meds' is a list of { 'name' (the medicine's name), 'description' (how to take the med(before or after food)), 'times_to_eat' (list of string where each is a milletary time in HHMM) and 'eat_upto' (date till which the med is taken(YYYY-MM-DD))}. Use your medical expertise to infer and fill in any missing details; if you cannot determine a value, use 'null'. The final output must be a valid JSON array, enclosed in third brackets, presented on a single line with no extra formatting, line breaks, or commentary."
            },
            {
              type: "image_url",
              image_url: { url: await convertImageToBase64(image) }
            }
          ]
        },
        { role: "assistant", content: "" }
      ],
      model: "llama-3.2-11b-vision-preview",
      temperature: 0.1,
      max_completion_tokens: 8192,
      top_p: 1,
      stream: false,
      stop: null
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const ocr = data?.choices?.[0]?.message?.content;
    if (!ocr) {
      return NextResponse.json(
        { error: "Failed to process image" },
        { status: 500 }
      );
    }

    console.log("Received response from GROQ:", ocr || "No content");
    return NextResponse.json({ ocr }, { status: 200 });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}