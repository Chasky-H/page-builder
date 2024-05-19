import {
  CPISideService,
  LocalCPISideService,
} from "@pepperi-addons/addon-testing-framework";
import { Client } from "@pepperi-addons/debug-server/dist";
import { v4 as uuid } from "uuid";
import { ABaseCpiSideTest } from "./aCPISideTest.test";

export class OnClientPageSkeletonLoadTest extends ABaseCpiSideTest {
  title = "OnClientPageSkeletonLoadTest";
  interceptor = 'OnClientPageSkeletonLoad';
  private testKey: string;
  pageKey: string;

  constructor(protected client: Client) {
    super(client);
    this.testKey = uuid();
    this.pageKey = '';
  }

  async createTestEnv(): Promise<any> {
    return this.container.get(CPISideService, LocalCPISideService);
  }


  async test(expect: Chai.ExpectStatic): Promise<any> {
    
    const apiService = this.pagesExternalApiService();
    const cpiService = this.pagesCPISideService();
    const page = await apiService.getPages();
    this.pageKey = page[0].Key;
    debugger;
    const emitBody = cpiService.emitEventBodyParser(this.interceptor,this.pageKey);
    
    console.log(emitBody);
    const emitEvent = await cpiService.emitEvent(this.interceptor,emitBody);
   const x = {"PageKey":"25a83703-0239-4e8a-8514-15704e35f8f4","State":{"BlockState":{},"PageParameters":{}}}
    console.log(emitEvent);



    // const filter = {
    //   Fields: [
    //     {
    //       FieldID: "Quantity",
    //       FieldType: "Integer",
    //       Title: "Quantity",
    //     },
    //     {
    //       FieldID: "Men.Cloths.Pants",
    //       FieldType: "MultipleStringValues",
    //       Title: "Pants Values",
    //       OptionalValues: [
    //         { Key: "jeans", Value: "Jeans" },
    //         { Key: "elegant", Value: "Elegant" },
    //       ],
    //     },
    //   ],
    // };

    // await this.trackerService.trackEvent({
    //   Key: this.eventKey,
    //   EventName: this.eventKey,
    //   DisplayEventName: this.eventKey,
    //   Description: "",
    //   Alias: this.eventKey,
    //   Filter: JSON.stringify(filter),
    //   Fields: [],
    // });
    // const trackedEvents = await this.trackerService.getTrackedEvents();

    // filter the event we just created and tracked, and check that the filter is correct
    // const trackedEvent = trackedEvents.find(
    //   (event) => event.Alias === this.eventKey
    // );
    //const parsedFilter = JSON.parse(trackedEvent!.Filter);

    // expect(parsedFilter.Fields[0]).to.have.nested.property(
    //   "FieldID",
    //   "Quantity"
    // );
    // expect(parsedFilter.Fields[1]).to.have.nested.property(
    //   "FieldType",
    //   "MultipleStringValues"
    // );

    return new Promise((resolve, reject) => {
      resolve(true);
    });
  }

  async cleanup(): Promise<void> {}

  override tests(
    describe: (suiteTitle: string, func: () => void) => void,
    it: (name: string, fn: Mocha.Func) => void,
    expect: Chai.ExpectStatic
  ): void {
    this.execute(describe, it, expect);
  }
}
