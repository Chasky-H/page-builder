import { PapiClient } from "@pepperi-addons/papi-sdk";
import { Client } from "@pepperi-addons/debug-server";

export class PagesExternalApiService {
  papiClient: PapiClient;
  addonUUID: string;

  constructor(client: Client) {
    this.addonUUID = client.AddonUUID;

    this.papiClient = new PapiClient({
      baseURL: client.BaseURL,
      token: client.OAuthAccessToken,
      addonUUID: client.AddonUUID,
      addonSecretKey: client.AddonSecretKey,
      actionUUID: client.ActionUUID,
    });
  }

  async deletePage(key: string, hidden?: boolean) {
    if (key && key.length > 0) {
      const body = {
        Hidden: hidden ? hidden : true,
        Key: key,
      };
      return await this.papiClient.post(
        `/addons/api/84c999c3-84b7-454e-9a86-71b7abc96554/api/objects?addonUUID=${this.addonUUID}&name=Pages&scheme=drafts`,
        body
      );
    } else {
      throw Error("No key was passed");
    }
  }

  async getPagesFromConfiguration() {
    return await this.papiClient.get(
      `/addons/api/84c999c3-84b7-454e-9a86-71b7abc96554/api/objects?addonUUID=${this.addonUUID}&name=Pages&scheme=drafts`
    );
  }
}
