
import * as nodeunit from 'nodeunit';
import {lq2xq} from "../src/lq2xq";


exports.single = (test: nodeunit.Test) => {
  (async function body() {
    const expected = '. contains text ("t1")';
    test.strictEqual(lq2xq("t1"), expected);
  })().catch(test.ifError).then(test.done);
}

exports.or = (test: nodeunit.Test) => {
  (async function body() {
    const expected = '. contains text (("t1") ftor ("t2"))';
    test.strictEqual(lq2xq("t1 t2"), expected);
    test.strictEqual(lq2xq("t1 OR t2"), expected);
    test.strictEqual(lq2xq("t1 || t2"), expected);
  })().catch(test.ifError).then(test.done);
}
exports.and = (test: nodeunit.Test) => {
  (async function body() {
    const expected = '. contains text (("t1") ftand ("t2"))';
    test.strictEqual(lq2xq("t1 AND t2"), expected);
    test.strictEqual(lq2xq("t1 && t2"), expected);
  })().catch(test.ifError).then(test.done);
}

exports.andor = (test: nodeunit.Test) => {
  (async function body() {
    const expr = "t1 AND t2 || t3 && t4";   // lucene query always group right to left
    const expected = '. contains text (("t1") ftand (("t2") ftor (("t3") ftand ("t4"))))';
    test.strictEqual(lq2xq(expr), expected);
    test.strictEqual(lq2xq("t1 AND (t2 || (t3 && t4))"), expected);
  })().catch(test.ifError).then(test.done);
}

exports.andorgroup = (test: nodeunit.Test) => {
  (async function body() {
    test.strictEqual(lq2xq("(t1 AND t2) || t3 && t4"), 
        '. contains text ((("t1") ftand ("t2")) ftor (("t3") ftand ("t4")))');
    test.strictEqual(lq2xq("t1 AND (t2 || t3) && t4"), 
        '. contains text (("t1") ftand ((("t2") ftor ("t3")) ftand ("t4")))');
  })().catch(test.ifError).then(test.done);
}

exports.phraseSingle = (test: nodeunit.Test) => {
  (async function body() {
    test.strictEqual(lq2xq(`"i am"`), `. contains text ("i am")`);
  })().catch(test.ifError).then(test.done);
}

exports.fields = (test: nodeunit.Test) => {
  (async function body() {
    test.strictEqual(
        lq2xq("title:term"),
        `(title contains text "term")`
    )
    test.strictEqual(
        lq2xq("t1 title:term"),
        `((. contains text "t1") OR (title contains text "term"))`
    )
    test.strictEqual(
        lq2xq("title:term t2"),
        `((title contains text "term") OR (. contains text "t2"))`
    )
    test.strictEqual(
        lq2xq('title:"a phrase" t2'),
        `((title contains text "a phrase") OR (. contains text "t2"))`
    )
  })().catch(test.ifError).then(test.done);
}

exports.range = (test: nodeunit.Test) => {
  (async function body() {
    test.throws(()=>lq2xq(`{aida TO carmen}`), "range query on fields only");
    test.strictEqual(lq2xq(`title:{aida TO carmen}`), `(title>"aida" AND title<"carmen")`);
    test.strictEqual(lq2xq(`title:[aida TO carmen] token`),
        `((title>="aida" AND title<="carmen") OR (. contains text "token"))`);
    test.strictEqual(lq2xq(`title:[aida TO carmen] +token`),
        `(title>="aida" AND title<="carmen") AND (. contains text "token")`);
  })().catch(test.ifError).then(test.done);
}

exports.wildcard = (test: nodeunit.Test) => {
  (async function body() {
    test.strictEqual(lq2xq(`test*`), `. contains text ("test.*" using wildcards)`);
    test.strictEqual(lq2xq(`title:test?d`), `(title contains text "test.d" using wildcards)`);
  })().catch(test.ifError).then(test.done);
}
exports.proximity = (test: nodeunit.Test) => {
  (async function body() {
    test.strictEqual(lq2xq(`"i am"~2`), `. contains text ("i am" distance at most 2 words)`);
    test.strictEqual(lq2xq(`title:"i am"~2`), `(title contains text "i am" distance at most 2 words)`);
  })().catch(test.ifError).then(test.done);
}

exports.fuzzy = (test: nodeunit.Test) => {
  (async function body() {
    
    test.throws(()=>lq2xq(`token~0.9`), `Can't convert fuzzy search`);
    test.strictEqual(lq2xq(`token~0.9`, {similarityConverter: (similarity)=>{
      return `using option xhive:fuzzy "similarity=${similarity}"`;
    }}), '. contains text ("token" using option xhive:fuzzy "similarity=0.9")')
    
  })().catch(test.ifError).then(test.done);
}

exports.modifiers = (test: nodeunit.Test) => {
  (async function body() {
    test.strictEqual(lq2xq(`t1 +t2 -t3 +t4`), `. contains text ("t2") ftand ("t4") ftand ftnot ("t3")`);
  })().catch(test.ifError).then(test.done);
}

exports.fieldGroup = (test: nodeunit.Test) => {
  (async function body() {
    test.strictEqual(
        lq2xq("title:(+t2) title:(-t3)"),
        '(title contains text "t2") AND not(title contains text "t3")'
    )
    test.strictEqual(
        lq2xq("title:(t1 +t2 -t3)"),
        '(title contains text "t2") AND not(title contains text "t3")'
    )
    test.strictEqual(
        lq2xq("title:(+t2) title:(-t3) +ta -tb"),
        '(title contains text "t2") AND (. contains text "ta") AND' +
        ' not(title contains text "t3") AND not(. contains text "tb")'
    )
  })().catch(test.ifError).then(test.done);
}

exports.xpathField =(test: nodeunit.Test) => {
  (async function body() {
    test.strictEqual(
        lq2xq("title:(+t2) //object_name:-name"),
        '(title contains text "t2") AND not(//object_name contains text "name")'
    )

  })().catch(test.ifError).then(test.done);
}



