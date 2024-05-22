import { Page } from "@pepperi-addons/papi-sdk";
import { v4 as uuid } from "uuid";

const sizeArr: ("none" | "sm" | "md" | "lg")[] = ["none", "sm", "md", "lg"];

export function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function generateMockPage() {
  const mockPage: Page = {
    Key: uuid(),
    Name: `Page By Pages Internal Tests #${randomIntFromInterval(1, 1e7)}`,
    Description: `This is a page description #${randomIntFromInterval(1, 1e7)}`,
    Blocks: [],
    Layout: {
      VerticalSpacing: sizeArr[randomIntFromInterval(0, 3)],
      HorizontalSpacing: sizeArr[randomIntFromInterval(0, 3)],
      SectionsGap: sizeArr[randomIntFromInterval(0, 3)],
      MaxWidth: randomIntFromInterval(0, 50),
      ColumnsGap: sizeArr[randomIntFromInterval(0, 3)],
      Sections: [],
    },
  };

  return mockPage;
}
