import { ABaseCrudTests } from "./aCrudTest.test";
import { ITestExecutor } from "../../interfaces/TestExecutor";

export class GetPageKeyTest extends ABaseCrudTests implements ITestExecutor {
  title: string = "GetPageKeyTest";
  pageKey: string = "";

  tests(
    describe: (suiteTitle: string, func: () => void) => void,
    it: (name: string, fn: Mocha.Func) => void,
    expect: Chai.ExpectStatic
  ): void {
    describe("Page Builder GET Endpoints - from list & by key", async () => {
      it("Get Published Pages Test", async () => {
        const service = this.pagesApiService();
        const pages = await service.getPublishedPages();
        this.pageKey = pages[0].Key as string;

        expect(pages).to.be.an("array").and.to.have.length.greaterThan(0);
        expect(pages[0]).to.be.an("object").that.is.not.empty;
        expect(pages[0].Description)
          .to.be.a("string")
          .that.has.length.greaterThan(0);
        expect(pages[0].Key).to.be.a("string").with.lengthOf(36);
        expect(pages[0].Name).to.be.a("string").with.length.greaterThan(0);
        expect(pages[0].Blocks).to.be.an("array");
        expect(pages[0].Layout.ColumnsGap)
          .to.be.a("string")
          .with.length.greaterThan(0);
        expect(pages[0].Layout.SectionsGap)
          .to.be.a("string")
          .with.length.greaterThan(0);
        expect(pages[0].Layout.VerticalSpacing)
          .to.be.a("string")
          .with.length.greaterThan(0);
        expect(pages[0].Layout.HorizontalSpacing)
          .to.be.a("string")
          .with.length.greaterThan(0);
        expect(pages[0].Layout.MaxWidth)
          .to.be.a("number")
          .that.is.greaterThanOrEqual(0);
        expect(pages[0].Layout.Sections)
          .to.be.an("array")
          .that.has.length.greaterThanOrEqual(0);
        expect(pages[0].Blocks[0].Key).to.be.a("string").that.has.lengthOf(36);
        expect(pages[0].Blocks[0].Configuration.AddonUUID)
          .to.be.a("string")
          .that.has.lengthOf(36);
        expect(pages[0].Blocks[0].Configuration.Resource)
          .to.be.a("string")
          .that.has.length.greaterThan(0);
        expect(pages[0].Blocks[0].Configuration.Data).to.be.an("object");
      });

      it("Get Page By Key Test", async () => {
        const service = this.pagesApiService();
        const pageByKey = await service.getPage(this.pageKey);

        expect(pageByKey).to.be.an("object").that.is.not.empty;
        expect(pageByKey.Description)
          .to.be.a("string")
          .that.has.length.greaterThan(0);
        expect(pageByKey.Key).to.be.a("string").with.lengthOf(36);
        expect(pageByKey.Name).to.be.a("string").with.length.greaterThan(0);
        expect(pageByKey.Blocks).to.be.an("array");
        expect(pageByKey.Layout.ColumnsGap)
          .to.be.a("string")
          .with.length.greaterThan(0);
        expect(pageByKey.Layout.SectionsGap)
          .to.be.a("string")
          .with.length.greaterThan(0);
        expect(pageByKey.Layout.VerticalSpacing)
          .to.be.a("string")
          .with.length.greaterThan(0);
        expect(pageByKey.Layout.HorizontalSpacing)
          .to.be.a("string")
          .with.length.greaterThan(0);
        expect(pageByKey.Layout.MaxWidth)
          .to.be.a("number")
          .that.is.greaterThanOrEqual(0);
        expect(pageByKey.Layout.Sections)
          .to.be.an("array")
          .that.has.length.greaterThanOrEqual(0);
        expect(pageByKey.Blocks[0].Key).to.be.a("string").that.has.lengthOf(36);
        expect(pageByKey.Blocks[0].Configuration.AddonUUID)
          .to.be.a("string")
          .that.has.lengthOf(36);
        expect(pageByKey.Blocks[0].Configuration.Resource)
          .to.be.a("string")
          .that.has.length.greaterThan(0);
        expect(pageByKey.Blocks[0].Configuration.Data).to.be.an("object");
      });
    });
  }
}
