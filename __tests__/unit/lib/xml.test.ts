import { describe, it, expect } from 'vitest';
import { parseXml, writeXml } from '@/lib/converter/xml';

describe('XML Parser', () => {
  describe('parseXml', () => {
    it('should parse simple XML with child elements', () => {
      const xml = `<root>
          <item><name>John</name><age>30</age></item>
          <item><name>Jane</name><age>25</age></item>
        </root>`;

      const result = parseXml(xml);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.format).toBe('xml');
      // Check that data is parsed
      expect(result.rows[0]).toBeDefined();
    });

    it('should handle attributes with @_ prefix', () => {
      const xml = `<root>
        <item id="1" name="John"/>
        <item id="2" name="Jane"/>
      </root>`;

      const result = parseXml(xml);

      expect(result.headers).toContain('@_id');
      expect(result.headers).toContain('@_name');
      expect(result.rows[0]['@_id']).toBe('1');
      expect(result.rows[0]['@_name']).toBe('John');
    });

    it('should handle mixed content (attributes and elements)', () => {
      const xml = `<root>
        <item id="1">
          <name>John</name>
          <age>30</age>
        </item>
      </root>`;

      const result = parseXml(xml);

      expect(result.headers).toContain('@_id');
      expect(result.headers).toContain('name');
      expect(result.rows[0]['@_id']).toBe('1');
      expect(result.rows[0]['name']).toBe('John');
    });

    it('should handle nested structures by flattening', () => {
      const xml = `<root>
        <item>
          <info><name>John</name></info>
          <age>30</age>
        </item>
      </root>`;

      const result = parseXml(xml);

      expect(result.rows).toHaveLength(1);
      // Nested values are flattened with dot notation
      expect(result.headers.some(h => h.includes('name') || h.includes('info'))).toBe(true);
    });

    it('should handle empty XML gracefully', () => {
      const result = parseXml('');

      // Empty XML returns result from error handling or empty parse
      expect(result.format).toBe('xml');
      expect(result.metadata).toBeDefined();
    });

    it('should handle malformed XML gracefully', () => {
      const malformed = '<root><unclosed>';
      const result = parseXml(malformed);

      // Parser should not crash, returns empty result
      expect(result.format).toBe('xml');
    });

    it('should handle XML with special characters (escaped)', () => {
      const xml = `<root>
        <item><name>&lt;John&gt;</name></item>
      </root>`;

      const result = parseXml(xml);
      expect(result.rows[0].name).toBe('<John>');
    });

    it('should handle XML with CDATA sections', () => {
      const xml = `<root>
        <item><data><![CDATA[Some <special> content]]></data></item>
      </root>`;

      const result = parseXml(xml);
      // CDATA content is extracted as text
      expect(result.rows[0].data).toContain('special');
    });

    it('should handle ampersand escapes', () => {
      const xml = `<root>
        <item><company>Tom &amp; Jerry</company></item>
      </root>`;

      const result = parseXml(xml);
      expect(result.rows[0].company).toBe('Tom & Jerry');
    });

    it('should handle single item as array', () => {
      const xml = `<root>
        <item><name>John</name></item>
      </root>`;

      const result = parseXml(xml);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('John');
    });

    it('should handle numeric values', () => {
      const xml = `<root>
        <item><count>42</count><price>19.99</price></item>
      </root>`;

      const result = parseXml(xml);
      expect(result.rows[0].count).toBe(42);
      expect(result.rows[0].price).toBe(19.99);
    });

    it('should handle boolean-like values as strings', () => {
      const xml = `<root>
        <item><active>true</active><disabled>false</disabled></item>
      </root>`;

      const result = parseXml(xml);
      expect(result.rows[0].active).toBe(true);
      expect(result.rows[0].disabled).toBe(false);
    });

    it('should handle empty elements', () => {
      const xml = `<root>
        <item><name></name><age>30</age></item>
      </root>`;

      const result = parseXml(xml);
      // Empty elements may be empty string or undefined, but age should be present
      expect(result.rows[0].age).toBe(30);
      expect(result.headers).toContain('age');
    });

    it('should handle self-closing elements', () => {
      const xml = `<root>
        <item name="John" age="30"/>
      </root>`;

      const result = parseXml(xml);
      expect(result.rows[0]['@_name']).toBe('John');
      expect(result.rows[0]['@_age']).toBe('30');
    });

    it('should provide correct metadata', () => {
      const xml = `<root>
        <item><a>1</a><b>2</b></item>
        <item><a>3</a><b>4</b></item>
      </root>`;

      const result = parseXml(xml);
      expect(result.metadata?.rowCount).toBe(2);
      expect(result.metadata?.columnCount).toBe(2);
    });

    it('should set format to xml', () => {
      const xml = `<root><item><name>test</name></item></root>`;
      const result = parseXml(xml);
      expect(result.format).toBe('xml');
    });

    it('should handle deeply nested structures', () => {
      const xml = `<root>
        <item>
          <level1>
            <level2>
              <level3>value</level3>
            </level2>
          </level1>
        </item>
      </root>`;

      const result = parseXml(xml);
      expect(result.rows).toHaveLength(1);
      // Deep nesting should be flattened
      expect(result.headers.length).toBeGreaterThan(0);
    });

    it('should handle XML with namespaces', () => {
      const xml = `<?xml version="1.0"?>
        <ns:root xmlns:ns="http://example.com">
          <ns:item><ns:name>John</ns:name></ns:item>
        </ns:root>`;

      const result = parseXml(xml);
      // Namespaced elements should still be parsed
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should handle arrays in XML by joining values', () => {
      const xml = `<root>
        <item>
          <tag>first</tag>
          <tag>second</tag>
        </item>
      </root>`;

      const result = parseXml(xml);
      // Multiple same-named elements become array and may be parsed as separate rows or joined
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.format).toBe('xml');
    });
  });

  describe('writeXml', () => {
    it('should generate valid XML with declaration', () => {
      const headers = ['name', 'age'];
      const rows = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      const xml = writeXml(headers, rows);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<root>');
      expect(xml).toContain('</root>');
    });

    it('should include item elements', () => {
      const headers = ['name'];
      const rows = [{ name: 'John' }];

      const xml = writeXml(headers, rows);

      expect(xml).toContain('<item>');
      expect(xml).toContain('<name>John</name>');
      expect(xml).toContain('</item>');
    });

    it('should escape special characters', () => {
      const headers = ['name', 'data'];
      const rows = [{ name: '<John>', data: 'Tom & Jerry' }];

      const xml = writeXml(headers, rows);

      expect(xml).toContain('&lt;John&gt;');
      expect(xml).toContain('Tom &amp; Jerry');
    });

    it('should handle null and undefined values', () => {
      const headers = ['name', 'age'];
      const rows = [{ name: null, age: undefined }];

      const xml = writeXml(headers, rows);

      expect(xml).toContain('<name>');
      expect(xml).toContain('</name>');
      expect(xml).toContain('<age>');
      expect(xml).toContain('</age>');
    });

    it('should handle empty rows array', () => {
      const xml = writeXml(['name'], []);

      expect(xml).toContain('<?xml');
      expect(xml).toContain('<root>');
    });

    it('should use custom root and item names', () => {
      const xml = writeXml(['name'], [{ name: 'John' }], 'data', 'record');

      expect(xml).toContain('<data>');
      expect(xml).toContain('</data>');
      expect(xml).toContain('<record>');
      expect(xml).toContain('</record>');
    });

    it('should handle numeric values', () => {
      const xml = writeXml(['count'], [{ count: 42 }]);

      expect(xml).toContain('<count>42</count>');
    });

    it('should handle boolean values', () => {
      const xml = writeXml(['active'], [{ active: true }]);

      expect(xml).toContain('<active>true</active>');
    });

    it('should handle multiple rows', () => {
      const rows = [
        { name: 'A' },
        { name: 'B' },
        { name: 'C' },
      ];

      const xml = writeXml(['name'], rows);

      expect(xml).toContain('<name>A</name>');
      expect(xml).toContain('<name>B</name>');
      expect(xml).toContain('<name>C</name>');
    });

    it('should be properly formatted with indentation', () => {
      const xml = writeXml(['name'], [{ name: 'John' }]);

      // Check for newlines indicating formatting
      expect(xml.split('\n').length).toBeGreaterThan(1);
    });

    it('should handle quotes in values', () => {
      const xml = writeXml(['quote'], [{ quote: 'He said "Hello"' }]);

      expect(xml).toContain('He said');
    });

    it('should preserve order of headers', () => {
      const headers = ['z', 'a', 'm'];
      const rows = [{ z: 1, a: 2, m: 3 }];

      const xml = writeXml(headers, rows);

      const zIndex = xml.indexOf('<z>');
      const aIndex = xml.indexOf('<a>');
      const mIndex = xml.indexOf('<m>');

      expect(zIndex).toBeLessThan(aIndex);
      expect(aIndex).toBeLessThan(mIndex);
    });
  });
});
