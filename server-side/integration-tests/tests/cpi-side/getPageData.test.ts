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
    this.pageKey = page[0].Key;

    const pageFromCPISide = await cpiService.emitEvent("AddonAPI", {
      AddonUUID: apiService.addonUUID,
      method: "GET",
      RelativeURL: `/addon-cpi/pages/${this.pageKey}`,
    });

    const emitEventResObj = JSON.parse(pageFromCPISide?.data?.Value);

    const block = emitEventResObj?.Blocks[0];
  
    expect(block.Configuration).to.be.an("object");
    expect(block.Key).to.be.a("string").that.has.lengthOf(36);
    expect(block.Configuration.AddonUUID).to.be.a("string").that.has.lengthOf(36);
    expect(block.Configuration.Resource).to.be.a("string").that.has.length.greaterThanOrEqual(5);
    expect(block.Configuration.Data).to.be.an("object");

    const layout = emitEventResObj?.Layout;

    expect(layout.ColumnsGap).to.be.a("string").that.has.length.greaterThanOrEqual(2);
    expect(layout.HorizontalSpacing).to.be.a("string").that.has.length.greaterThanOrEqual(2);
    expect(layout.SectionsGap).to.be.a("string").that.has.length.greaterThanOrEqual(2);
    expect(layout.VerticalSpacing).to.be.a("string").that.has.length.greaterThanOrEqual(2);
    expect(layout.MaxWidth).to.be.a("number").that.is.equal(0);
    expect(layout.HorizontalSpacing).to.be.a("string").that.has.length.greaterThanOrEqual(2);
    expect(layout.Sections).to.be.an("array").that.has.length.greaterThanOrEqual(0);

    expect(emitEventResObj.Name).to.be.a("string").that.has.length.greaterThanOrEqual(0);
    expect(emitEventResObj.Description).to.be.a("string").that.has.length.greaterThanOrEqual(0);
    expect(emitEventResObj.Key).to.be.a("string").that.has.length.greaterThanOrEqual(36);

    

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
