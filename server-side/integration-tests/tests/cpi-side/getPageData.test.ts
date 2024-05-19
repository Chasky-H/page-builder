import {
  CPISideService,
  LocalCPISideService,
} from "@pepperi-addons/addon-testing-framework";
import { Client } from "@pepperi-addons/debug-server/dist";
import { v4 as uuid } from "uuid";
import { ABaseCpiSideTest } from "./aCPISideTest.test";

export class OnClientGetPageDataTest extends ABaseCpiSideTest {
  title = "OnClientGetPageDataTest";
  endpoint = "get_page_data";
  private testKey: string;
  pageKey: string;

  constructor(protected client: Client) {
    super(client);
    this.testKey = uuid();
    this.pageKey = "";
  }

  async createTestEnv(): Promise<any> {
    return this.container.get(CPISideService, LocalCPISideService);
  }

  async test(expect: Chai.ExpectStatic): Promise<any> {
    
    const apiService = this.pagesExternalApiService();
    const cpiService = this.pagesCPISideService();

    //await cpiService.sync();

    const page = await apiService.getPages();
    console.log(page);
    this.pageKey = page[0].Key;

    const pageFromCPISide = await cpiService.emitEvent("AddonAPI", {
      AddonUUID: apiService.addonUUID,
      method: "GET",
      RelativeURL: `/addon-cpi/get_page_data?key=${this.pageKey}`,
    });

    const emitEventResObj = JSON.parse(pageFromCPISide?.data?.Value);
    console.log(emitEventResObj);

    const relation = emitEventResObj?.availableBlocks[0]?.relation;

    expect(emitEventResObj?.availableBlocks[0]?.addonPublicBaseURL)
      .to.be.a("string")
      .that.has.length.greaterThanOrEqual(10)
      .and.includes("Public");
    expect(relation).to.be.an("object").that.is.not.undefined.and.is.not.null;
    expect(relation?.AddonBaseURL)
      .to.be.a("string")
      .that.includes("Addon/Public");
    expect(relation?.AddonRelativeURL)
      .to.be.a("string")
      .with.length.greaterThanOrEqual(5);
    expect(relation?.AddonUUID).to.be.a("string").that.has.lengthOf(36);
    expect(relation?.ComponentName)
      .to.be.a("string")
      .that.has.length.greaterThanOrEqual(5);
    expect(relation?.CreationDateTime).to.be.a("string").with.lengthOf(24);
    expect(relation?.Description)
      .to.be.a("string")
      .that.has.length.greaterThanOrEqual(5);
    expect(relation?.ElementName)
      .to.be.a("string")
      .with.length.greaterThanOrEqual(5);
    expect(relation?.ElementsModule)
      .to.be.a("string")
      .that.is.equal("WebComponents");
    expect(relation?.Hidden).to.be.a("boolean").that.is.false;
    expect(relation?.Key)
      .to.be.a("string")
      .that.has.length.greaterThanOrEqual(10);
    expect(relation?.ModificationDateTime)
      .to.be.a("string")
      .that.has.lengthOf(24);
    expect(relation?.ModuleName)
      .to.be.a("string")
      .that.has.length.greaterThanOrEqual(5);
    expect(relation?.Name)
      .to.be.a("string")
      .that.has.length.greaterThanOrEqual(0);
    expect(relation?.RelationName).that.includes("Block");
    expect(relation?.SubType).that.is.equal("NG14");
    expect(relation?.Type).that.is.equal("NgComponent");

    const pageView = emitEventResObj?.page;

    expect(pageView.Name)
      .to.be.a("string")
      .that.has.length.greaterThanOrEqual(0);
    expect(pageView.Key).to.be.a("string").that.has.length.lessThanOrEqual(36);
    expect(pageView.Description)
      .to.be.a("string")
      .that.has.length.greaterThanOrEqual(0);

    const layout = pageView?.Layout;

    expect(layout.ColumnsGap)
      .to.be.a("string")
      .that.has.length.greaterThanOrEqual(2);
    expect(layout.HorizontalSpacing)
      .to.be.a("string")
      .that.has.length.greaterThanOrEqual(2);
    expect(layout.SectionsGap)
      .to.be.a("string")
      .that.has.length.greaterThanOrEqual(2);
    expect(layout.VerticalSpacing)
      .to.be.a("string")
      .that.has.length.greaterThanOrEqual(2);
    expect(layout.MaxWidth).to.be.a("number").that.is.equal(0);
    expect(layout.HorizontalSpacing)
      .to.be.a("string")
      .that.has.length.greaterThanOrEqual(2);
    expect(layout.Sections)
      .to.be.an("array")
      .that.has.length.greaterThanOrEqual(0);

    const block = pageView?.Blocks[0];

    expect(block.Configuration).to.be.an("object").that.is.not.empty;
    expect(block.Configuration.Data).to.be.an("object").that.is.not.empty;
    expect(block.Key).to.be.a("string").that.has.lengthOf(36);
    expect(block.Configuration.AddonUUID)
      .to.be.a("string")
      .that.has.lengthOf(36);
    expect(block.Configuration.Resource)
      .to.be.a("string")
      .that.has.length.greaterThanOrEqual(5);

    return new Promise((resolve, reject) => {
      resolve(true);
    });
  }

  async cleanup(): Promise<void> {}

  override tests(
    describe: (suiteTitle: string, func: () => void) => void,
    it: (name: string, fn: Mocha.Func) => void,
    expect: Chai.ExpectStatic
  ): void {
    this.execute(describe, it, expect);
  }
}
