import {luceneQueryParser} from './luceneQuery/luceneQueryParser';
import * as _ from "lodash";

/**
 * lucene query at https://lucene.apache.org/core/2_9_4/queryparsersyntax.html 
 * 
 * xquery spec at 
 * https://www.w3.org/XML/Group/qtspecs/specifications/xpath-full-text-30/html/Overview.html#tq-ft-evaluate-function
 */
export interface RenderOptions {
  /**
   * The default field to search, default value '.'
   */
  defaultField? : string;
  /**
   * The xquery search option to append to term/phrase, default is nothing.
   * Example: using stemming using default stop words
   */
  termPhraseModifier? : string;
  /**
   * xquery full text spec does not support fuzzy search, if implementaion supports it, implement this function
   * default is null, error is thrown if similarity specifier is encountered in lucene query.
   */
  similarityConverter? : (similarity:number) => string;
  /**
   * for expanding a term or phrase to multiple terms or phrases, default is null.
   */
  termPhraseExpander? : (termOrPhrase:string, filedName:string|null, isPhrase:boolean) => Array<string>;
}

const DefaultRenderOption : RenderOptions = {
  defaultField: '.',
  termPhraseModifier: null
}

/**
 * The following are private types
 */
interface Field {
  field : string;
  prefix: string | null;
};
interface BaseTerm {
  field: Field | null;
  term: string;
  boost: string | null;
  prefix: string | null;
};
interface Term extends BaseTerm {
  similarity: number | null;
}
interface Phrase extends BaseTerm {
  proximity: number | null;
}
interface Range {
  term_min: string | null,
  term_max: string | null,
  inclusive: boolean,
  field: Field | null
}
interface Expression {
  left: Term | Phrase | Expression;
  operator: string;
  right: Term | Phrase | Expression;
}

class RenderContext {
  readonly option: RenderOptions;
  readonly hasField: boolean;
  constructor(option: RenderOptions, hasField: boolean) {
    this.option = option;
    this.hasField = hasField;
  }
}

const renderField = (term: BaseTerm, ctx: RenderContext) : string => {
  if (ctx.hasField) { // add contains text for every single term
    let fieldname : string;
    if (term.field != null)
      fieldname = term.field.field; 
    else 
      fieldname = ctx.option.defaultField;
    return `${fieldname} contains text `;
  } else return "";
}

const convertWildCard = (term: string) : string => {
  if (/[*?]/.test(term)) {
    return term.replace(/([*])/g, ".*").replace(/[?]/g, ".");
  }
  else return null;
}

const renderTerm = (term: Term, ctx : RenderContext) : string => {
    if (ctx.option.termPhraseExpander) {
      let expr = _(ctx.option.termPhraseExpander(term.term, term.field?term.field.field:null, false))
          .map((newTerm:string)=>renderTermClause(_.assign({},term, {term:newTerm}), ctx))
          .join(' ftor ');
      return `(${renderField(term, ctx)}${expr})`;
    } else
      return `(${renderField(term, ctx)}${renderTermClause(term, ctx)})`;
}
const renderTermClause = (term: Term, ctx : RenderContext) : string => {
  let result : string;
  let wildCardTerm = convertWildCard(term.term);
  if (wildCardTerm != null)
    result = `"${wildCardTerm}" using wildcards`;
  else
    result = `"${term.term}"`;
  if (term.boost != null) result += ` weight {${term.boost}}`;
  if (term.similarity != null) {
    if (ctx.option.similarityConverter == null)
      throw new Error("Similarity is not supported")
    else
      result += ` ${ctx.option.similarityConverter(term.similarity)}`;
  }
  if (ctx.option.termPhraseModifier) result += ` ${ctx.option.termPhraseModifier}`;
  return result;
}
const renderPhrase = (phrase: Phrase, ctx: RenderContext) : string => {
  if (ctx.option.termPhraseExpander) {
    let expr = _(ctx.option.termPhraseExpander(phrase.term, phrase.field?phrase.field.field:null, false))
        .map((newPhrase:string)=>renderPhraseClause(_.assign({},phrase, {term:newPhrase}), ctx))
        .join(' ftor ');
    return `(${renderField(phrase, ctx)}${expr})`;
  } else
    return `(${renderField(phrase, ctx)}${renderPhraseClause(phrase, ctx)})`

}
const renderPhraseClause = (phrase: Phrase, ctx: RenderContext) : string => {
  let result = `"${phrase.term}"`;
  if (phrase.boost != null) result += ` weight {${phrase.boost}}`;
  if (phrase.proximity != null) result += ` distance at most ${phrase.proximity} words`;
  if (ctx.option.termPhraseModifier) result += ` ${ctx.option.termPhraseModifier}`;
  return result;
}

const renderOperator = (op: string, ctx: RenderContext) : string => {
  switch (op) {
    case 'AND': return ctx.hasField ? 'AND' : 'ftand';
    case 'OR': return ctx.hasField ? 'OR' : 'ftor';
    default : throw new Error(`Operator ${op} is not recognized.`);
  }
}
const renderRange = (range: Range, ctx: RenderContext) : string => {
  if (range.field == null) throw new Error("Must specify field on range query");
  let field =  range.field.field ;
  let ops = range.inclusive ? ['>=', '<='] : ['>','<'];
  return `(${field}${ops[0]}"${range.term_min}" AND ${field}${ops[1]}"${range.term_max}")`;
}

const renderExpr = (expr: Expression, ctx: RenderContext) : string => {
  if (expr.operator == 'NOT') {
    throw new Error("Lucene query's NOT operator is broken, see https://stackoverflow.com/questions/17969461/" +
        "not-operator-doesnt-work-in-query-lucene, use - modifier instead");
  }
  return `(${render(expr.left, ctx)} ${renderOperator(expr.operator, ctx)} ${render(expr.right, ctx)})`;
}

const isSameField = (t1: BaseTerm, t2: BaseTerm) : boolean => {
  if (t1.field === t2.field) return true;   // both null
  else if (t1.field && t2.field) return t1.field.field == t2.field.field;
  else return false;
} 
const isTerm = (node: any) : boolean => _.has(node, "similarity");
const isPhrase = (node: any) : boolean => _.has(node, "proximity");
const isTermOrPhrase = (node: any) : boolean => isTerm(node) || isPhrase(node);
const isRange = (node: any) : boolean => _.has(node, 'inclusive');
const hasOperator = (node: any) : boolean => (true && node.operator);
const hasLeft = (node: any) : boolean => true && node.left;

const render = (tree:any, ctx: RenderContext) : string => {
  if (tree === undefined) return '';
  else if (isTerm(tree)) return renderTerm(tree, ctx);
  else if (isPhrase(tree)) return renderPhrase(tree, ctx);
  else if (isRange(tree)) return renderRange(tree, ctx);
  else if (hasOperator(tree)) return renderExpr(tree, ctx); // binary or unary expression
  else if (hasLeft(tree)) return render(tree.left, ctx);    // an operator-less (single term) expression
  else throw new Error(`${JSON.stringify(tree, null, '  ')} can't be rendered`);
}

// scan tree recursively to see if any field exists
const hasField = (tree:any) : boolean => {
  if (tree === undefined) return false;
  else return tree.field != null || hasField(tree.left) || hasField(tree.right);
}
const pressField = (tree:any) => {
  if (tree) {
    if (tree.field) {
      if (tree.left) tree.left.field = tree.field;
      if (tree.right) tree.right.field = tree.field;
    }
    if (tree.left) pressField(tree.left);
    if (tree.right) pressField(tree.right);
  }
}
const hasAnd = (tree: any) : boolean => {
  if (tree === undefined) return false;
  else return tree.operator === 'AND' || hasAnd(tree.left) || hasAnd(tree.right);
}
const hasPrefix = (tree: any) : boolean => {
  if (tree === undefined) return false;
  else return (tree.prefix) || hasPrefix(tree.left) || hasPrefix(tree.right);
}
const reconstructClauses = (tree: any, musts: Array<any>, mustnots: Array<any>) : void => {
  if (tree) {
    if (tree.prefix) {
      if (tree.prefix == '+') musts.push(tree);
      else if (tree.prefix == '-') mustnots.push(tree);
    } else if (isRange(tree)) {
      musts.push(tree);
    }
    reconstructClauses(tree.left, musts, mustnots);
    reconstructClauses(tree.right, musts, mustnots);
  }
}

/**
 * 
 * lucene query to xquery translater
 * 
 * @param {string} lq
 * @returns {string}
 *  
 */
export const lq2xq = (lq: string, option? : RenderOptions) : string => {
  let tree = luceneQueryParser.parse(lq);
  if (!option) option = DefaultRenderOption;
  else option = _.assign({}, DefaultRenderOption, option);  // ensure default values are filled

  let hasFieldInExr = hasField(tree);
  if (hasFieldInExr) pressField(tree);  // ensure field is set in every Term or Phrase, instead of Expression
  let result = '';
  if (!hasFieldInExr) result += `${option.defaultField} contains text `;
  
  if (hasPrefix(tree)) {
    // if there are + or -, then we ignore all logical operators such as AND OR NOT, they are incompatible
    let pluses = [], minuses = [];
    reconstructClauses(tree, pluses, minuses);
    if (!hasFieldInExr) {
      let plusExprs = _.map(pluses, (p) => render(p, new RenderContext(option, hasFieldInExr)));
      let minusExprs = _.map(minuses, (p) => 'ftnot ' + render(p, new RenderContext(option, hasFieldInExr)));
      result += _.join(_.concat(plusExprs, minusExprs), ' ftand ');
    } else {
      //console.log(JSON.stringify(tree, null, '  '));
      let plusExprs = _.map(pluses, (p) => render(p, new RenderContext(option, hasFieldInExr)));
      let minusExprs = _.map(minuses, (p) => 'not' + render(p, new RenderContext(option, hasFieldInExr)));
      result += _.join(_.concat(plusExprs, minusExprs), ' AND ');
    }
  } else {
    result += render(tree, new RenderContext(option, hasFieldInExr));
  }
  return result;
}