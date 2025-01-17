import {
  BaseTest,
  CPASService,
  CPISideService,
  LocalCPISideService,
  SyncResult,
} from "@pepperi-addons/addon-testing-framework";

export class PagesTestCpiSideService {
  private _cpiSideService!: CPISideService | LocalCPISideService;
  addonUUID: string;

  constructor(cpiSideService: CPISideService | LocalCPISideService) {
    this._cpiSideService = cpiSideService;
    this.addonUUID = "50062e0c-9967-4ed4-9102-f2bc50602d41";
  }

  get cpiSideService(): CPISideService | LocalCPISideService {
    return this._cpiSideService;
  }

  async emitEvent(eventKey, eventData): Promise<any> {
    return await this.cpiSideService.emitEvent(eventKey, eventData);
  }

  async sync(): Promise<SyncResult> {
    return await this.cpiSideService.sync();
  }

  async resync() {
    return await this.cpiSideService.resync();
  }

  async getPage(key: string) {
    // debugger;
    return await this.cpiSideService.clientApi.addons.api
      .uuid(this.addonUUID)
      .get({
        url: `/pages/${key}'`,
      });
  }

  emitEventBodyParser(event: string, page: Object, body?: any) {
    return body
      ? body
      : {
          Page: page,
          State: { PageParameters: {}, BlocksState: {} },
        };
  }
}
