import { ABaseCrudTests } from "./aCrudTest.test";
import { ITestExecutor } from "../../interfaces/TestExecutor";
import { randomIntFromInterval } from "../../utillities/mock-page.util";

export class varVariablesTest extends ABaseCrudTests implements ITestExecutor {
  title: string = "VarVariablesTest";
  pageKey: string = "";

  tests(
    describe: (suiteTitle: string, func: () => void) => void,
    it: (name: string, fn: Mocha.Func) => void,
    expect: Chai.ExpectStatic
  ): void {
    describe("Page Builder VAR Endpoints Test", async () => {
      it("GET from VAR", async () => {
        const service = this.pagesApiService();
        const varFields = await service.getPagesVariables();

        expect(varFields.BLOCKS_NUMBER_LIMITATION)
          .to.be.a("number")
          .that.is.greaterThan(0);
        expect(varFields.PAGE_SIZE_LIMITATION)
          .to.be.a("number")
          .that.is.greaterThan(0);
        expect(varFields.Key).to.be.a("string").that.is.equal("PagesVariables");
      });

      it("POST to VAR", async () => {
        const limit = randomIntFromInterval(10, 20);
        const size = randomIntFromInterval(100, 200);
        const service = this.pagesApiService();
        const testObject = {
          Key: "PagesVariables",
          PAGE_SIZE_LIMITATION: size,
          BLOCKS_NUMBER_LIMITATION: limit,
        };

        const res = await service.savePagesVariables(testObject);
        console.log(res);

        expect(res.BLOCKS_NUMBER_LIMITATION)
          .to.be.a("number")
          .that.is.greaterThan(0)
          .and.is.equal(limit);
        expect(res.PAGE_SIZE_LIMITATION)
          .to.be.a("number")
          .that.is.greaterThan(0)
          .and.is.equal(size);
        expect(res.Key).to.be.a("string").that.is.equal("PagesVariables");
        expect(res.Hidden).to.be.a("boolean").that.is.false;

        const getAfterRes = await service.getPagesVariables();

        expect(getAfterRes.BLOCKS_NUMBER_LIMITATION)
          .to.be.a("number")
          .that.is.greaterThan(0)
          .and.is.equal(limit);
        expect(getAfterRes.PAGE_SIZE_LIMITATION)
          .to.be.a("number")
          .that.is.greaterThan(0)
          .and.is.equal(size);
        expect(getAfterRes.Key)
          .to.be.a("string")
          .that.is.equal("PagesVariables");
        console.log(getAfterRes);
      });
    });
  }
}
