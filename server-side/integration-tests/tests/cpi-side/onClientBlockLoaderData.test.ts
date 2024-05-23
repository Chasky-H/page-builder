import {
  CPISideService,
  LocalCPISideService,
} from "@pepperi-addons/addon-testing-framework";
import { Client } from "@pepperi-addons/debug-server/dist";
import { v4 as uuid } from "uuid";
import { ABaseCpiSideTest } from "./aCPISideTest.test";

export class OnClientBlockLoadDataTest extends ABaseCpiSideTest {
  title = "OnClientBlockLoadDataTest";
  interceptor = "GetBlockLoaderData";
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
    try {
      const cpiService = this.pagesCPISideService();

      const eventData = { Name: "List", BlockType: "AddonBlock" };
  
      const emitEvent = await cpiService.emitEvent(this.interceptor, eventData);
      console.log(emitEvent);
      const relation = emitEvent?.data?.relation;
  
      expect(emitEvent?.data?.addonPublicBaseURL).to.be.a('string').that.has.length.greaterThanOrEqual(10).and.includes('Public');
      expect(relation).to.be.an("object").that.is.not.undefined.and.is.not.null;
      expect(relation?.AddonBaseURL).to.be.a("string").that.includes("Addon/Public");
      expect(relation?.AddonRelativeURL).to.be.a("string").with.length.greaterThanOrEqual(5);
      expect(relation?.AddonUUID).to.be.a("string").that.has.lengthOf(36);
      expect(relation?.ComponentName).to.be.a("string").that.is.equal('ListComponent');
      expect(relation?.CreationDateTime).to.be.a("string").with.lengthOf(24);
      expect(relation?.Description).to.be.a("string").that.has.length.greaterThanOrEqual(5);
      expect(relation?.ElementName).to.be.a("string").with.length.greaterThanOrEqual(5).and.includes('abi');
      expect(relation?.ElementsModule).to.be.a("string").that.is.equal("WebComponents");
      expect(relation?.Hidden).to.be.a("boolean").that.is.false;
      expect(relation?.Key).to.be.a("string").that.includes("List").and.includes("AddonBlock");
      expect(relation?.ModificationDateTime).to.be.a("string").that.has.lengthOf(24);
      expect(relation?.ModuleName).to.be.a("string").that.is.equal("ListModule");
      expect(relation?.Name).to.be.equal("List");
      expect(relation?.RelationName).that.is.equal("AddonBlock");
      expect(relation?.SubType).that.is.equal("NG14");
      expect(relation?.Type).that.is.equal("NgComponent");
      expect(emitEvent.type).to.be.equal("Finish");
    } catch(e) {
      console.log('integration_tests::errorHere');
      console.log(e);
    }



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
