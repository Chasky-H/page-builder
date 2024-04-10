import { BaseTest } from "@pepperi-addons/addon-testing-framework";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import { PagesApiService } from "../../../pages-api.service";
import { PagesExternalApiService } from "../../services/pages-external-api.service";

export abstract class ABaseCrudTests extends BaseTest {
  protected _pagesApiService: PagesApiService | undefined;
  protected _pagesExternalApiService: PagesExternalApiService | undefined;
  protected _papiClient: PapiClient | undefined;

  protected pagesApiService(): PagesApiService {
    if (!this._pagesApiService) {
      this._pagesApiService = new PagesApiService(this.container.client);
    }

    return this._pagesApiService;
  }

  protected pagesExternalApiService(): PagesExternalApiService {
    if (!this._pagesExternalApiService) {
      this._pagesExternalApiService = new PagesExternalApiService(
        this.container.client
      );
    }

    return this._pagesExternalApiService;
  }
}
