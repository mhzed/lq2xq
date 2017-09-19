"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const peg = require("pegjs");
const pegJsGrammar_1 = require("./pegJsGrammar");
/**
 * See https://lucene.apache.org/core/2_9_4/queryparsersyntax.html for full syntax doc
 *
 */
exports.luceneQueryParser = peg.generate(pegJsGrammar_1.pegjsGrammar);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibHVjZW5lUXVlcnlQYXJzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJsdWNlbmVRdWVyeVBhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDZCQUE2QjtBQUM3QixpREFBNEM7QUFFNUM7OztHQUdHO0FBQ1UsUUFBQSxpQkFBaUIsR0FBZ0IsR0FBRyxDQUFDLFFBQVEsQ0FBQywyQkFBWSxDQUFDLENBQUMifQ==