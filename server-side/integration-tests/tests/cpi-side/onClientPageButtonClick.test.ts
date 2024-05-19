import {
  CPISideService,
  LocalCPISideService,
} from "@pepperi-addons/addon-testing-framework";
import { Client } from "@pepperi-addons/debug-server/dist";
import { v4 as uuid } from "uuid";
import { ABaseCpiSideTest } from "./aCPISideTest.test";

export class OnClientPageButttonClickTest extends ABaseCpiSideTest {
  title = "OnClientPageButttonClickTest";
  interceptor = "OnClientPageButttonClick";
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

    const pages = await apiService.getPagesFromConfiguration();
    console.log(pages);

    const filter = pages.filter((data: any) => data.Name == "Avner King");
    console.log(filter);

    const eventData = {"action": "button-click", buttonKey: "AddonBlock" };

    const emitEvent = await cpiService.emitEvent(this.interceptor, eventData);
    console.log(emitEvent);
    const relation = emitEvent?.data?.relation;

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
