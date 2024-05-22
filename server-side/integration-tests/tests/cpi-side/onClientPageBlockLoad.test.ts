import {
  CPISideService,
  LocalCPISideService,
} from "@pepperi-addons/addon-testing-framework";
import { Client } from "@pepperi-addons/debug-server/dist";
import { v4 as uuid } from "uuid";
import { ABaseCpiSideTest } from "./aCPISideTest.test";

export class OnClientPageBlockLoadTest extends ABaseCpiSideTest {
  title = "OnClientPageBlockLoadTest";
  interceptor = "OnClientPageBlockLoad";
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

    const block = emitEvent?.data?.PageView?.Blocks[0];

    expect(block.Configuration).to.be.an("object").that.is.not.empty;
    expect(block.Key).to.be.a("string").that.has.lengthOf(36);
    expect(block.RelationData.AddonUUID).to.be.a("string").that.has.lengthOf(36);
    expect(block.RelationData.Name).to.be.a("string").that.has.length.greaterThanOrEqual(5);

    const state = emitEvent?.data?.State;

    expect(state.BlocksState).to.be.deep.equal({});
    expect(state.PageParameters).to.be.deep.equal({});

    expect(emitEvent?.type).to.be.equal("Finish");

    expect(emitEvent?.data?.PageView.Key).to.be.a("string").that.has.lengthOf(36);

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
