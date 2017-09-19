export const pegjsGrammar = `
/*
 * Lucene Query Grammar for PEG.js
 * ========================================
 *
 * Original version: https://github.com/thoward/lucene-query-parser.js
 * https://github.com/polyfractal/elasticsearch-inquisitor/blob/master/_site/js/vendor/lucene/lucene-query.grammar
 * Modified to support xpath in filed name
 *
 */

start
  = _* node:node+
    {
        return node[0];
    }
  / _*
    {
        return {};
    }
  / EOF
    {
        return {};
    }

node
  = operator:operator_exp EOF
    {
        return {
            'operator': operator
            };
    }
  / operator:operator_exp right:node
    {
        return right;
    }
  / left:group_exp operator:operator_exp* right:node*
    {
        var node= {
            'left':left
            };

        var right =
                right.length == 0
                ? null
                : right[0]['right'] == null
                    ? right[0]['left']
                    : right[0];

        if (right != null)
        {
            node['operator'] = operator==''? 'OR' : operator[0];
            node['right'] = right;
        }

        return node;
    }

group_exp
  = field_exp:field_exp _*
    {
        return field_exp;
    }
  / paren_exp

paren_exp
  = "(" node:node+ ")" _*
    {
        return node[0];
    }

field_exp
  = fieldname:fieldname? range:range_operator_exp
    {
        range['field'] =
            fieldname == ''
                ? "<implicit>"
                : fieldname;

        return range;
    }
  / fieldname:fieldname node:paren_exp
    {
        node['field']= fieldname;
        return node;
    }
  / fieldname:fieldname? term:term
    {
        var fieldexp = {
            'field':
                fieldname == ''
                    ? "<implicit>"
                    : fieldname
            };

        for(var key in term)
            fieldexp[key] = term[key];

        return fieldexp;
    }

fieldname
  = op:prefix_operator_exp? fieldname:path_term [:]
      {
        var result = { 'field' : fieldname };

        if('' != op)
        {
            result['prefix'] = op;
        }

        return result;
    }

term
  = op:prefix_operator_exp? term:quoted_term proximity:proximity_modifier? boost:boost_modifier? _*
      {
        var result = { 'term': term };

        if('' != proximity)
        {
            result['proximity'] = proximity;
        }
        if('' != boost)
        {
            result['boost'] = boost;
        }
        if('' != op)
        {
            result['prefix'] = op;
        }

        return result;
    }
  / op:prefix_operator_exp? term:unquoted_term similarity:fuzzy_modifier? boost:boost_modifier? _*
    {
        var result = { 'term': term };
        if('' != similarity)
        {
            result['similarity'] = similarity;
        }
        if('' != boost)
        {
            result['boost'] = boost;
        }
        if('' != op)
        {
            result['prefix'] = op;
        }
        return result;
    }

/** allows basic xpath chars, but not predicates with expressions */
path_term
  = term:[a-zA-Z/.@_-]+
    {
        return term.join('');
    }

unquoted_term
  = term:[^: \\t\\r\\n\\f\\{\\}()"+-/^~\\[\\]]+
    {
        return term.join('');
    }

quoted_term
  = '"' term:[^"]+ '"'
    {
        return term.join('');
    }

proximity_modifier
  = '~' proximity:int_exp
    {
        return proximity;
    }

boost_modifier
  = '^' boost:decimal_or_int_exp
    {
        return boost;
    }

fuzzy_modifier
  = '~' fuzziness:decimal_exp?
    {
        return fuzziness == '' ? 0.5 : fuzziness;
    }

decimal_or_int_exp
 = decimal_exp
 / int_exp

decimal_exp
 = '0.' val:[0-9]+
    {
        return parseFloat("0." + val.join(''));
    }

int_exp
  = val:[0-9]+
    {
        return parseInt(val.join(''));
    }

range_operator_exp
  = '[' term_min:unquoted_term _* 'TO' _+ term_max:unquoted_term ']'
    {
        return {
            'term_min': term_min,
            'term_max': term_max,
            'inclusive': true
        };
    }
  / '{' term_min:unquoted_term _* 'TO' _+ term_max:unquoted_term '}'
    {
        return {
            'term_min': term_min,
            'term_max': term_max,
            'inclusive': false
        };
    }

operator_exp
  = _* operator:operator _+
    {
        return operator;
    }
  / _* operator:operator EOF
    {
        return operator;
    }

operator
  = 'OR'
  / 'AND'
  / 'NOT'
  / '||' { return 'OR'; }
  / '&&' { return 'AND'; }

prefix_operator_exp
  = _* operator:prefix_operator
    {
        return operator;
    }

prefix_operator
  = '+'
  / '-'

_ "whitespace"
  = [ \\t\\r\\n\\f]+

EOF
  = !.
`;
