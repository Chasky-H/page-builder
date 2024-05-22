import { PapiClient } from "@pepperi-addons/papi-sdk";
import { Client } from "@pepperi-addons/debug-server";

export class PagesExternalApiService {
  papiClient: PapiClient;
  addonUUID: string;
  configurationsUUID: string;

  constructor(client: Client) {
    this.addonUUID = client.AddonUUID;
    this.configurationsUUID = "84c999c3-84b7-454e-9a86-71b7abc96554";

    this.papiClient = new PapiClient({
      baseURL: client.BaseURL,
      token: client.OAuthAccessToken,
      addonUUID: client.AddonUUID,
      addonSecretKey: client.AddonSecretKey,
    });
  }

  async deletePage(key: string, hidden?: boolean) {
    if (key && key.length > 0) {
      const body = {
        Hidden: hidden ? hidden : true,
        Key: key,
      };
      return await this.papiClient.post(
        `/addons/api/${this.configurationsUUID}/api/objects?addonUUID=${this.addonUUID}&name=Pages&scheme=drafts`,
        body
      );
    } else {
      throw Error("No key was passed");
    }
  }

  async getPagesFromConfiguration() {
    return await this.papiClient.get(
      `/addons/api/${this.configurationsUUID}/api/objects?addonUUID=${this.addonUUID}&name=Pages&scheme=drafts`
    );
  }

  async sleep(ms: number) {
    console.debug(`Sleep: ${ms} milliseconds`, "color: #f7df1e");
    await new Promise((f) => setTimeout(f, ms));
  }

  async getAuditLogResultObjectIfValid(
    uri: string,
    loopsAmount = 30
  ): Promise<any> {
    let auditLogResponse;
    do {
      auditLogResponse = await this.papiClient.get(uri);
      auditLogResponse =
        auditLogResponse === null
          ? auditLogResponse
          : auditLogResponse[0] === undefined
          ? auditLogResponse
          : auditLogResponse[0];
      //This case is used when AuditLog was not created at all (This can happen and it is valid)
      if (auditLogResponse === null) {
        await this.sleep(4000);
        console.log("Audit Log was not found, waiting...");
        loopsAmount--;
      }
      //This case will only retry the get call again as many times as the "loopsAmount"
      else if (auditLogResponse.Status.ID == "2") {
        await this.sleep(2000);
        console.log(
          "In_Progres: Status ID is 2, Retry " + loopsAmount + " Times."
        );
        loopsAmount--;
      }
    } while (
      (auditLogResponse === null || auditLogResponse.Status.ID == "2") &&
      loopsAmount > 0
    );

    //Check Date and Time
    try {
      if (
        !auditLogResponse.CreationDateTime.includes(
          new Date().toISOString().split("T")[0] && "Z"
        ) ||
        !auditLogResponse.ModificationDateTime.includes(
          new Date().toISOString().split("T")[0] && "Z"
        )
      ) {
        throw new Error("Error in Date and Time in Audit Log API Response");
      }
    } catch (error) {
      if (error instanceof Error) {
        error.stack =
          "Date and Time in Audit Log API Response:\n" + error.stack;
      }
      throw error;
    }
    return auditLogResponse;
  }

  //methods to call addonAPI
  async get_page(queryString?: string) {
    const url =
      queryString && queryString.length > 0
        ? `/addons/api/${this.addonUUID}/api/get_page${queryString}`
        : `/addons/api/${this.addonUUID}/api/get_page`;
    return await this.papiClient.get(url);
  }

  async upsertPage(page: Object) {
    return await this.papiClient.post(
      `/addons/api/${this.addonUUID}/api/pages`,
      page
    );
  }

  async getPages(queryString?: string) {
    const url =
      queryString && queryString.length > 0
        ? `/addons/api/${this.addonUUID}/api/pages${queryString}`
        : `/addons/api/${this.addonUUID}/api/pages`;
    return await this.papiClient.get(url);
  }

  async getPagesVarVariables(queryString?: string) {
    const url =
      queryString && queryString.length > 0
        ? `/addons/api/${this.addonUUID}/api/pages_variables${queryString}`
        : `/addons/api/${this.addonUUID}/api/pages_variables`;
    return await this.papiClient.get(url);
  }

  async upsertPagesVarVariables(options: Object) {
    return await this.papiClient.post(
      `/addons/api/${this.addonUUID}/api/pages_variables`,
      options
    );
  }

  async pagesImportFile(object: Object) {
    return await this.papiClient.post(
      `/addons/api/${this.addonUUID}/api/pages_import_file`,
      object
    );
  }

  async pagesExportFile(object: Object) {
    return await this.papiClient.post(
      `/addons/api/${this.addonUUID}/api/pages_export_file`,
      object
    );
  }
}
