import { BaseTest } from "@pepperi-addons/addon-testing-framework";
import { AddonFile } from "@pepperi-addons/papi-sdk";

export class GetPageKeyTest extends BaseTest {
  title: string = "GetPageKeyTest";
  tests(
    describe: (suiteTitle: string, func: () => void) => void,
    it: (name: string, fn: Mocha.Func) => void,
    expect: Chai.ExpectStatic
  ): void {
    describe("Blabla Saar King", () => {
      it("formatter needed", () => {
        expect(1).to.be.equal(1);
      });
    });
  }
}
