"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const lq2xq_1 = require("../src/lq2xq");
exports.single = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            const expected = '. contains text ("t1")';
            test.strictEqual(yield lq2xq_1.lq2xq("t1"), expected);
        });
    })().catch(test.ifError).then(test.done);
};
exports.or = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            const expected = '. contains text (("t1") ftor ("t2"))';
            test.strictEqual(yield lq2xq_1.lq2xq("t1 t2"), expected);
            test.strictEqual(yield lq2xq_1.lq2xq("t1 OR t2"), expected);
            test.strictEqual(yield lq2xq_1.lq2xq("t1 || t2"), expected);
        });
    })().catch(test.ifError).then(test.done);
};
exports.and = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            const expected = '. contains text (("t1") ftand ("t2"))';
            test.strictEqual(yield lq2xq_1.lq2xq("t1 AND t2"), expected);
            test.strictEqual(yield lq2xq_1.lq2xq("t1 && t2"), expected);
        });
    })().catch(test.ifError).then(test.done);
};
exports.andor = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            const expr = "t1 AND t2 || t3 && t4"; // lucene query always group right to left
            const expected = '. contains text (("t1") ftand (("t2") ftor (("t3") ftand ("t4"))))';
            test.strictEqual(yield lq2xq_1.lq2xq(expr), expected);
            test.strictEqual(yield lq2xq_1.lq2xq("t1 AND (t2 || (t3 && t4))"), expected);
        });
    })().catch(test.ifError).then(test.done);
};
exports.andorgroup = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.strictEqual(yield lq2xq_1.lq2xq("(t1 AND t2) || t3 && t4"), '. contains text ((("t1") ftand ("t2")) ftor (("t3") ftand ("t4")))');
            test.strictEqual(yield lq2xq_1.lq2xq("t1 AND (t2 || t3) && t4"), '. contains text (("t1") ftand ((("t2") ftor ("t3")) ftand ("t4")))');
        });
    })().catch(test.ifError).then(test.done);
};
exports.phraseSingle = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.strictEqual(yield lq2xq_1.lq2xq(`"i am"`), `. contains text ("i am")`);
        });
    })().catch(test.ifError).then(test.done);
};
exports.fields = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.strictEqual(yield lq2xq_1.lq2xq("title:term"), `(title contains text "term")`);
            test.strictEqual(yield lq2xq_1.lq2xq("t1 title:term"), `((. contains text "t1") OR (title contains text "term"))`);
            test.strictEqual(yield lq2xq_1.lq2xq("title:term t2"), `((title contains text "term") OR (. contains text "t2"))`);
            test.strictEqual(yield lq2xq_1.lq2xq('title:"a phrase" t2'), `((title contains text "a phrase") OR (. contains text "t2"))`);
        });
    })().catch(test.ifError).then(test.done);
};
exports.range = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            //test.throws(()=>lq2xq(`{aida TO carmen}`), "range query on fields only");
            test.strictEqual(yield lq2xq_1.lq2xq(`title:{aida TO carmen}`), `(title>"aida" AND title<"carmen")`);
            test.strictEqual(yield lq2xq_1.lq2xq(`title:[aida TO carmen] token`), `((title>="aida" AND title<="carmen") OR (. contains text "token"))`);
            test.strictEqual(yield lq2xq_1.lq2xq(`title:[aida TO carmen] +token`), `(title>="aida" AND title<="carmen") AND (. contains text "token")`);
        });
    })().catch(test.ifError).then(test.done);
};
exports.wildcard = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.strictEqual(yield lq2xq_1.lq2xq(`test*`), `. contains text ("test.*" using wildcards)`);
            test.strictEqual(yield lq2xq_1.lq2xq(`title:test?d`), `(title contains text "test.d" using wildcards)`);
        });
    })().catch(test.ifError).then(test.done);
};
exports.proximity = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.strictEqual(yield lq2xq_1.lq2xq(`"i am"~2`), `. contains text ("i am" distance at most 2 words)`);
            test.strictEqual(yield lq2xq_1.lq2xq(`title:"i am"~2`), `(title contains text "i am" distance at most 2 words)`);
        });
    })().catch(test.ifError).then(test.done);
};
exports.fuzzy = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            //test.throws(()=>await lq2xq(`token~0.9`), `Can't convert fuzzy search`);
            test.strictEqual(yield lq2xq_1.lq2xq(`token~0.9`, { similarityConverter: (similarity) => {
                    return `using option xhive:fuzzy "similarity=${similarity}"`;
                } }), '. contains text ("token" using option xhive:fuzzy "similarity=0.9")');
        });
    })().catch(test.ifError).then(test.done);
};
exports.modifiers = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.strictEqual(yield lq2xq_1.lq2xq(`t1 +t2 -t3 +t4`), `. contains text ("t2") ftand ("t4") ftand ftnot ("t3")`);
        });
    })().catch(test.ifError).then(test.done);
};
exports.fieldGroup = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.strictEqual(yield lq2xq_1.lq2xq("title:(+t2) title:(-t3)"), '(title contains text "t2") AND not(title contains text "t3")');
            test.strictEqual(yield lq2xq_1.lq2xq("title:(t1 +t2 -t3)"), '(title contains text "t2") AND not(title contains text "t3")');
            test.strictEqual(yield lq2xq_1.lq2xq("title:(+t2) title:(-t3) +ta -tb"), '(title contains text "t2") AND (. contains text "ta") AND' +
                ' not(title contains text "t3") AND not(. contains text "tb")');
        });
    })().catch(test.ifError).then(test.done);
};
exports.xpathField = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.strictEqual(yield lq2xq_1.lq2xq("title:(+t2) //object_name:-name"), '(title contains text "t2") AND not(//object_name contains text "name")');
        });
    })().catch(test.ifError).then(test.done);
};
exports.expander = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.strictEqual(yield lq2xq_1.lq2xq("abc AND efg", { termPhraseExpander: (term, field, isPhrase, prefix) => Promise.resolve([term, 'new' + term]) }), '. contains text (("abc" ftor "newabc") ftand ("efg" ftor "newefg"))');
            test.strictEqual(yield lq2xq_1.lq2xq("abc AND title:efg", {
                termPhraseExpander: (term, field, isPhrase, prefix) => Promise.resolve([term, 'new' + term])
            }), '((. contains text "abc" ftor "newabc") AND (title contains text "efg" ftor "newefg"))');
            test.strictEqual(yield lq2xq_1.lq2xq('abc AND "efg etc"', {
                termPhraseExpander: (term, field, isPhrase, prefix) => Promise.resolve([term, 'new' + term])
            }), '. contains text (("abc" ftor "newabc") ftand ("efg etc" ftor "newefg etc"))');
        });
    })().catch(test.ifError).then(test.done);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGxxMnhxLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGVzdGxxMnhxLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFFQSx3Q0FBbUM7QUFHbkMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQW1CO0lBQ25DLENBQUM7O1lBQ0MsTUFBTSxRQUFRLEdBQUcsd0JBQXdCLENBQUM7WUFDMUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLGFBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNoRCxDQUFDO0tBQUEsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzNDLENBQUMsQ0FBQTtBQUVELE9BQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxJQUFtQjtJQUMvQixDQUFDOztZQUNDLE1BQU0sUUFBUSxHQUFHLHNDQUFzQyxDQUFDO1lBQ3hELElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxhQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLGFBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNwRCxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sYUFBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELENBQUM7S0FBQSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDM0MsQ0FBQyxDQUFBO0FBQ0QsT0FBTyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQW1CO0lBQ2hDLENBQUM7O1lBQ0MsTUFBTSxRQUFRLEdBQUcsdUNBQXVDLENBQUM7WUFDekQsSUFBSSxDQUFDLFdB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