import { Injectable } from '@angular/core';
import { XMLParser } from 'fast-xml-parser';
import XMLBuilder from 'fast-xml-builder';


const arrayExceptions: { tag: string; parent: string }[] = [
  { tag: 'product',   parent: 'products'   },
  { tag: 'combination', parent: 'combinations' },
  { tag: 'order',     parent: 'orders'     },
  { tag: 'category',  parent: 'categories' },
  { tag: 'tax_rule',  parent: 'tax_rules'  },
];

@Injectable({
  providedIn: 'root',
})
export class XmlSerializer {
  private parser: XMLParser;
  private builder: InstanceType<typeof XMLBuilder>;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      parseTagValue: true,
      isArray: (tagName, jPath) => {
        const parent = (jPath as string).split('.').at(-2);
        if (arrayExceptions.some((e) => e.tag === tagName && e.parent === parent)) return true;
        // The 'language' case is intentionally excluded: PS8 language arrays are
        // correctly handled by the parent heuristic above. Re-enabling it causes
        // double-wrapping in some PS8 XML responses.
        return parent === tagName + 's';
      },
    });

    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
      indentBy: '  ',
    });
  }

  toXml<T extends object>(obj: T): string {
    return this.builder.build(obj);
  }

  fromXml<T = unknown>(xml: string): T {
    return this.parser.parse(xml) as T;
  }
}
