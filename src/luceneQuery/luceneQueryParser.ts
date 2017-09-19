
import * as peg from "pegjs";
import {pegjsGrammar} from "./pegJsGrammar";

/**
 * See https://lucene.apache.org/core/2_9_4/queryparsersyntax.html for full syntax doc
 *
 */
export const luceneQueryParser : peg.Parser = peg.generate(pegjsGrammar);
