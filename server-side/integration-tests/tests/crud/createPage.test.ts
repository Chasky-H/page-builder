import { ABaseCrudTests } from "./aCrudTest.test";
import { ITestExecutor } from "../../interfaces/TestExecutor";
import { generateMockPage } from "../../utillities/mock-page.util";
import { Page } from "@pepperi-addons/papi-sdk";

export class CreatePageTest extends ABaseCrudTests implements ITestExecutor {
  title: string = "CreatePageTest";
  pageKey: string = "";

  tests(
    describe: (suiteTitle: string, func: () => void) => void,
    it: (name: string, fn: Mocha.Func) => void,
    expect: Chai.ExpectStatic
  ): void {
    describe("Page Builder POST Endpoints - Publish page", async () => {
      it("POST Publish Page", async () => {
        const service = this.pagesApiService();
        const testPage = generateMockPage();
        this.pageKey = testPage.Key as string;

        const newPage = await service.publishPage(testPage);

        expect(newPage.Key)
          .to.be.a("string")
          .that.has.lengthOf(36)
          .and.is.equal(testPage.Key);
        expect(newPage.Layout)
          .to.be.an("object")
          .to.deep.equal(testPage.Layout);
        expect(newPage.Blocks)
          .to.be.an("array")
          .that.is.deep.equal(testPage.Blocks);
        expect(newPage.Parameters).to.be.an("array").that.is.deep.equal([]);
        expect(newPage.Name).to.be.a("string").that.is.equal(testPage.Name);
        expect(newPage.Description)
          .to.be.a("string")
          .that.is.equal(testPage.Description);

        //get page from api to make sure same content as the created and created result
        const gottenPage = await service.getPage(this.pageKey);

        expect(gottenPage.Key)
          .to.be.a("string")
          .that.has.lengthOf(36)
          .and.is.equal(testPage.Key);
        expect(gottenPage.Layout)
          .to.be.an("object")
          .to.deep.equal(testPage.Layout);
        expect(gottenPage.Blocks)
          .to.be.an("array")
          .that.is.deep.equal(testPage.Blocks);
        expect(gottenPage.Parameters).to.be.an("array").that.is.deep.equal([]);
        expect(gottenPage.Name).to.be.a("string").that.is.equal(testPage.Name);
        expect(gottenPage.Description)
          .to.be.a("string")
          .that.is.equal(testPage.Description);
      });
      it("DELETE Published page", async () => {
        const externalService = this.pagesExternalApiService();

        if (this.pageKey.length > 0) {
          //delete page via configuration
          await externalService.deletePage(this.pageKey);

          const currentPages =
            await externalService.getPagesFromConfiguration();
         //checking that the page we removed is not included in the returned data from configurations
          for (const page of currentPages) {
            expect(page.Key).not.to.be.equal(this.pageKey);
          }
        } else {
          throw new Error("Page key was not passed");
        }
      });
    });
  }
}
