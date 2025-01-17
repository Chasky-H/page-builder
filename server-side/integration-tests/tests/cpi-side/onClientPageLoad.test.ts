import {
    CPISideService,
    LocalCPISideService,
  } from "@pepperi-addons/addon-testing-framework";
  import { Client } from "@pepperi-addons/debug-server/dist";
  import { v4 as uuid } from "uuid";
  import { ABaseCpiSideTest } from "./aCPISideTest.test";
  
  export class OnClientPageLoadTest extends ABaseCpiSideTest {
    title = "OnClientPageLoadTest";
    interceptor = "OnClientPageLoad";
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
      const page = await apiService.getPages();
      this.pageKey = page[0].Key;
      
      const emitBody = cpiService.emitEventBodyParser(this.interceptor, page[0]);
  
      const emitEvent = await cpiService.emitEvent(this.interceptor, emitBody);

      expect(emitEvent?.type).to.be.equal("Finish");

      const availableBlockData = emitEvent?.data?.AvailableBlocksData[0];
      
      expect(availableBlockData?.PageRemoteLoaderOptions?.EditorElementName).to.be.a("string").that.has.length.greaterThanOrEqual(5);
      expect(availableBlockData?.PageRemoteLoaderOptions?.ElementName).to.be.a("string").that.has.length.greaterThanOrEqual(5);
      expect(availableBlockData?.PageRemoteLoaderOptions?.ModuleName).to.be.a("string").that.has.length.greaterThanOrEqual(5).that.is.equal("WebComponents");
      expect(availableBlockData?.PageRemoteLoaderOptions?.RemoteEntry).to.be.a("string").that.has.length.greaterThanOrEqual(5).and.includes(".js");

      expect(availableBlockData?.RelationAddonUUID).to.be.a("string").that.has.lengthOf(36);
      expect(availableBlockData?.RelationAvailable).to.be.a("boolean").that.is.true;
      expect(availableBlockData?.RelationName).to.be.a("string").that.has.length.greaterThanOrEqual(5);
      expect(availableBlockData?.RelationTitle).to.be.a("string").that.has.length.greaterThanOrEqual(5);

      const state = emitEvent?.data?.State;

      expect(state).to.be.an("object");

      const pageView = emitEvent?.data?.PageView;

      expect(pageView.Name).to.be.a("string").that.has.length.greaterThanOrEqual(3);
      expect(pageView.Key).to.be.a("string").that.has.length.lessThanOrEqual(36);
      expect(pageView.Description).to.be.a("string").that.has.length.greaterThanOrEqual(5);
  
      const layout = pageView?.Layout;
  
      expect(layout.ColumnsGap).to.be.a("string").that.has.length.greaterThanOrEqual(2);
      expect(layout.HorizontalSpacing).to.be.a("string").that.has.length.greaterThanOrEqual(2);
      expect(layout.SectionsGap).to.be.a("string").that.has.length.greaterThanOrEqual(2);
      expect(layout.VerticalSpacing).to.be.a("string").that.has.length.greaterThanOrEqual(2);
      expect(layout.MaxWidth).to.be.a("number").that.is.equal(0);
      expect(layout.HorizontalSpacing).to.be.a("string").that.has.length.greaterThanOrEqual(2);
      expect(layout.Sections).to.be.an("array").that.has.length.greaterThanOrEqual(0);
  
      const block = pageView?.Blocks[0];
  
      expect(block.Configuration).to.be.an("object");
      expect(block.Key).to.be.a("string").that.has.lengthOf(36);
      expect(block.RelationData.AddonUUID).to.be.a("string").that.has.lengthOf(36);
      expect(block.RelationData.Name).to.be.a("string").that.has.length.greaterThanOrEqual(5);

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
  