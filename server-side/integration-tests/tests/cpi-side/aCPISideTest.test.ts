import {
  BaseTest,
  CPASService,
  CPISideService,
  LocalCPISideService,
} from "@pepperi-addons/addon-testing-framework";
import { PagesExternalApiService } from "../../services/pages-external-api.service";
import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import { v4 as uuid } from "uuid";
import { PagesTestCpiSideService } from "../../services/cpi-side-service.service";

export abstract class ABaseCpiSideTest extends BaseTest {
  protected _pagesExternalApiService: PagesExternalApiService | undefined;
  protected _pagesCPIExternalApiService: PagesTestCpiSideService | undefined;
  protected papiClient: PapiClient;
  protected testIdentifierUUID: string;

  constructor(protected client: Client) {
    super();
    this.papiClient = new PapiClient({
      baseURL: client.BaseURL,
      token: client.OAuthAccessToken,
      addonUUID: client.AddonUUID,
      addonSecretKey: client.AddonSecretKey,
      actionUUID: client.ActionUUID,
    });
    this.testIdentifierUUID = uuid(); // this is used to identify the test in CloudWatch CPIService logs
  }

  protected pagesExternalApiService(): PagesExternalApiService {
    if (!this._pagesExternalApiService) {
      this._pagesExternalApiService = new PagesExternalApiService(
        this.container.client
      );
    }

    return this._pagesExternalApiService;
  }

  protected pagesCPISideService(): PagesTestCpiSideService {
    if (!this._pagesCPIExternalApiService) {
      this._pagesCPIExternalApiService = new PagesTestCpiSideService(
        this.container.get(CPISideService, LocalCPISideService)
      );
    }

    return this._pagesCPIExternalApiService;
  }

  async createTestEnv(): Promise<any> {
    return Promise.resolve();
  }

  test(expect: Chai.ExpectStatic): Promise<any> {
    return Promise.resolve();
  }

  validateTestResult(expect: Chai.ExpectStatic): Promise<any> {
    return Promise.resolve();
  }

  cleanup(): Promise<any> {
    return Promise.resolve();
  }

  override tests(
    describe: (suiteTitle: string, func: () => void) => void,
    it: (name: string, fn: Mocha.Func) => void,
    expect: Chai.ExpectStatic
  ): void {
    this.execute(describe, it, expect);
  }

  // execute is the main method of the test command.
  // it executes the following steps:
  // 1. setup env
  // 2. test flow
  execute(
    describe: (suiteTitle: string, func: () => void) => void,
    it: (name: string, fn: Mocha.Func) => void,
    expect: Chai.ExpectStatic
  ): void {
    describe(this.title, () => {
      it("createTestEnv", async () => {
        await this.createTestEnv();
      });
      it("Test", async () => {
        await this.test(expect);
      });
      it("Cleanup", async () => {
        await this.cleanup();
      });
    });
  }
}
