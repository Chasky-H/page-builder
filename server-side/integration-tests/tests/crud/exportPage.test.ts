import { ABaseCrudTests } from "./aCrudTest.test";
import { ITestExecutor } from "../../interfaces/TestExecutor";
import fetch from "node-fetch";

export class ExportPageTest extends ABaseCrudTests implements ITestExecutor {
  title: string = "ExportPageTest";
  pageKey: string = "";
  exportedPageForImport: any;

  tests(
    describe: (suiteTitle: string, func: () => void) => void,
    it: (name: string, fn: Mocha.Func) => void,
    expect: Chai.ExpectStatic
  ): void {
    describe("Page Builder Export Endpoints Test", async () => {
      it("GET Page from DIMX - Export", async () => {
        const service = this.pagesExternalApiService();
        const pageList = await service.getPages();
        this.pageKey = pageList[0]?.Key as string;
        const exportedObjects = await service.pagesExportFile({
          IncludeObjects: true,
          Where: `Key='${this.pageKey}'`,
        });
        await service.sleep(3000);
        if (exportedObjects?.URI) {
          const auditLogResponse = await service.getAuditLogResultObjectIfValid(
            exportedObjects.URI,
            50
          );
          console.log("audit res")
          console.log(auditLogResponse);
          const resultObject = JSON.parse(
            auditLogResponse.AuditInfo.ResultObject
          );
          let getDataFromFile = await (
            await fetch(resultObject.URI, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            })
          ).json();
          this.exportedPageForImport = resultObject;
          const exportedPage = getDataFromFile[0].Data.Data;
          const resource = getDataFromFile[0];
          const resourceData = getDataFromFile[0].Data;

          expect(resource.Key)
            .to.be.a("string")
            .that.has.lengthOf(36)
            .and.is.equal(this.pageKey);
          expect(resource.Description)
            .to.be.a("string")
            .that.has.length.greaterThanOrEqual(0);
          expect(resource.Name)
            .to.be.a("string")
            .that.has.length.greaterThanOrEqual(0);
          expect(resource.Profiles).to.be.an("array").that.has.lengthOf(0);
          expect(resourceData.AddonUUID)
            .to.be.a("string")
            .that.is.equal(service.addonUUID);
          expect(resourceData.Resource)
            .to.be.a("string")
            .that.is.equal("Pages");

          expect(exportedPage.Layout.ColumnsGap)
            .to.be.a("string")
            .that.has.length.greaterThan(0);
          expect(exportedPage.Layout.HorizontalSpacing)
            .to.be.a("string")
            .that.has.length.greaterThan(0);
          expect(exportedPage.Layout.SectionsGap)
            .to.be.a("string")
            .that.has.length.greaterThan(0);
          expect(exportedPage.Layout.VerticalSpacing)
            .to.be.a("string")
            .that.has.length.greaterThan(0);
          expect(exportedPage.Parameters).to.be.a("array").that.has.lengthOf(0);
          expect(exportedPage.Blocks)
            .to.be.a("array")
            .that.has.length.greaterThanOrEqual(0);
        } else {
          throw new Error("No URI was passed from DIMX");
        }
      });
      it("POST Pages to DIMX - Import", async () => {
        const service = this.pagesExternalApiService();

        const importObject = await service.pagesImportFile(
          this.exportedPageForImport
        );
        await service.sleep(3000);
        const auditLogResponse = await service.getAuditLogResultObjectIfValid(
          importObject.URI as string,
          50
        );
        const resultObject = JSON.parse(
          auditLogResponse.AuditInfo.ResultObject
        );
        let getDataFromFile = await (
          await fetch(resultObject.URI, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          })
        ).json();

        const updateData = getDataFromFile[0];

        expect(updateData.Key).to.be.a("string").that.has.lengthOf(36);
        expect(updateData.Status).to.be.a("string");
      });
      it("GET Page from DIMX - Export After Import", async () => {
        const service = this.pagesExternalApiService();

        const exportedObjects = await service.pagesExportFile({
          IncludeObjects: true,
          Where: `Key='${this.pageKey}'`,
        });
        await service.sleep(3000);
        if (exportedObjects?.URI) {
          const auditLogResponse = await service.getAuditLogResultObjectIfValid(
            exportedObjects.URI,
            50
          );
          const resultObject = JSON.parse(
            auditLogResponse.AuditInfo.ResultObject
          );
          let getDataFromFile = await (
            await fetch(resultObject.URI, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            })
          ).json();
          this.exportedPageForImport = resultObject;
          const exportedPage = getDataFromFile[0].Data.Data;
          const resource = getDataFromFile[0];
          const resourceData = getDataFromFile[0].Data;

          expect(resource.Key)
            .to.be.a("string")
            .that.has.lengthOf(36)
            .and.is.equal(this.pageKey);
          expect(resource.Description)
            .to.be.a("string")
            .that.has.length.greaterThanOrEqual(0);
          expect(resource.Name)
            .to.be.a("string")
            .that.has.length.greaterThanOrEqual(0);
          expect(resource.Profiles).to.be.an("array").that.has.lengthOf(0);
          expect(resourceData.AddonUUID)
            .to.be.a("string")
            .that.is.equal(service.addonUUID);
          expect(resourceData.Resource)
            .to.be.a("string")
            .that.is.equal("Pages");

          expect(exportedPage.Layout.ColumnsGap)
            .to.be.a("string")
            .that.has.length.greaterThan(0);
          expect(exportedPage.Layout.HorizontalSpacing)
            .to.be.a("string")
            .that.has.length.greaterThan(0);
          expect(exportedPage.Layout.SectionsGap)
            .to.be.a("string")
            .that.has.length.greaterThan(0);
          expect(exportedPage.Layout.VerticalSpacing)
            .to.be.a("string")
            .that.has.length.greaterThan(0);
          expect(exportedPage.Parameters).to.be.a("array").that.has.lengthOf(0);
          expect(exportedPage.Blocks)
            .to.be.a("array")
            .that.has.length.greaterThanOrEqual(0);
        } else {
          throw new Error("No URI was passed from DIMX");
        }
      });
    });
  }
}
