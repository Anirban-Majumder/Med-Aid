export interface Medicine {
  name: string,
  item: string,
  link: string,
  imgLink: string,
  price: number,
  deliveryCharge: number,
  offer: string,
  finalCharge: string,
  lson: string,
  deliveryTime: string,
  medicineAvailability: Boolean,
  minQty: number,
  saltName: string[],
  qtyItContainsDesc: number
}

export interface MedSearchSuggestion {
  medicineName: string,
  packSize: string,
  manufacturer: string,
  prescriptionNeeded: string,
  saltName: string[]
}

export interface LabAvailableAt {
  labId: number,
  labName: string,
}

export interface LabPriceByLab {
  labId: number,
  labName: string,
  final_rate: number,
  mrp: number,
  savings: string,
}

export interface LabPriceByPin {
  algoliaSearchString: string,
  labId: number,
  labName: string,
  mrp: number,
  minPrice: number,
  savings: string,
}

export interface HighlightResultField {
  value: string,
  matchLevel: string,
  fullyHighlighted?: boolean,
  matchedWords: string[],
}

export interface LabResultHighlight {
  itemName: HighlightResultField,
  type: HighlightResultField,
  Keyword: HighlightResultField,
  availableAt: { labName: HighlightResultField }[],
  healthCategory: HighlightResultField,
  popularPackageSection: HighlightResultField,
}

export interface LabResult {
  id: string,
  itemName: string,
  type: string,
  Keyword: string,
  order: number,
  testCount: number,
  includedTests: any[],
  url: string,
  minPrice: number,
  labName: string,
  fasting: string,
  availableAt: LabAvailableAt[],
  popular: boolean,
  category: string,
  healthCategory: string,
  popularPackageSection: string,
  report: string,
  mrp: number,
  savings: string,
  typeId: number,
  priceByLab: { [key: string]: LabPriceByLab },
  priceByPin: LabPriceByPin[],
  byLab: string,
  objectID: string,
  _highlightResult: LabResultHighlight,
}

//new
interface Test {
  itemId: string;
  itemName: string;
  type: string;
  description: string;
  fasting: string;
  url: string;
  testCount: number;
  category: string;
  testPreparation: string;
  testSample: string;
  whenToGetTested: string;
  imageUrl: string | null;
  commonQuestions: {
    title: string;
    text: Array<{
      question: string;
      answer: string;
    }>;
  };
  testRequirements: {
    title: string;
    requirements: string[];
  };
  child: any[];
  howItWorks: {
    title: string;
    text: string;
  };
  idealFor: string;
  typeId: number;
  healthcategory: string;
  popularsection: string;
  testType: string;
  report: string;
}

interface Accreditation {
  logo: string;
  name: string;
  description: string;
}

interface LabAddress {
  city: string;
  state: string;
  street: string;
  pincode: string;
  locality: string;
}

interface LabDescription {
  id: number;
  accreditation: Accreditation[];
  labName: string;
  labAddress: LabAddress[];
  labImages?: string[] | null;
  logo: string;
  rating: string;
  rating_count: number;
  reviews: string | null;
  isActive: boolean;
  description: string;
  short_Details?: string | null;
  report: string;
  extras?: {
    tags?: {
      text: string;
      imgUrl: string;
      status: boolean;
    }[];
  };
  order?: number | null;
  slider?: boolean | null;
  banners?: { url: string; order: number }[] | null;
}

interface PriceDescription {
  hc: number;
  offered_price: number;
  final_price: number;
  discount_amount: number;
  discount_percent: number;
  discount_percent_info: string;
  discount_amount_info: string;
}

interface Lab {
  priceDescription: PriceDescription;
  labDescription: LabDescription;
}

export interface DiagnosticData {
  tests: Test[];
  labs: Lab[];
  labsCount: number;
}
