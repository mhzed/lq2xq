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
            test.strictEqual(lq2xq_1.lq2xq("t1"), expected);
        });
    })().catch(test.ifError).then(test.done);
};
exports.or = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            const expected = '. contains text (("t1") ftor ("t2"))';
            test.strictEqual(lq2xq_1.lq2xq("t1 t2"), expected);
            test.strictEqual(lq2xq_1.lq2xq("t1 OR t2"), expected);
            test.strictEqual(lq2xq_1.lq2xq("t1 || t2"), expected);
        });
    })().catch(test.ifError).then(test.done);
};
exports.and = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            const expected = '. contains text (("t1") ftand ("t2"))';
            test.strictEqual(lq2xq_1.lq2xq("t1 AND t2"), expected);
            test.strictEqual(lq2xq_1.lq2xq("t1 && t2"), expected);
        });
    })().catch(test.ifError).then(test.done);
};
exports.andor = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            const expr = "t1 AND t2 || t3 && t4"; // lucene query always group right to left
            const expected = '. contains text (("t1") ftand (("t2") ftor (("t3") ftand ("t4"))))';
            test.strictEqual(lq2xq_1.lq2xq(expr), expected);
            test.strictEqual(lq2xq_1.lq2xq("t1 AND (t2 || (t3 && t4))"), expected);
        });
    })().catch(test.ifError).then(test.done);
};
exports.andorgroup = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.strictEqual(lq2xq_1.lq2xq("(t1 AND t2) || t3 && t4"), '. contains text ((("t1") ftand ("t2")) ftor (("t3") ftand ("t4")))');
            test.strictEqual(lq2xq_1.lq2xq("t1 AND (t2 || t3) && t4"), '. contains text (("t1") ftand ((("t2") ftor ("t3")) ftand ("t4")))');
        });
    })().catch(test.ifError).then(test.done);
};
exports.phraseSingle = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.strictEqual(lq2xq_1.lq2xq(`"i am"`), `. contains text ("i am")`);
        });
    })().catch(test.ifError).then(test.done);
};
exports.fields = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.strictEqual(lq2xq_1.lq2xq("title:term"), `(title contains text "term")`);
            test.strictEqual(lq2xq_1.lq2xq("t1 title:term"), `((. contains text "t1") OR (title contains text "term"))`);
            test.strictEqual(lq2xq_1.lq2xq("title:term t2"), `((title contains text "term") OR (. contains text "t2"))`);
            test.strictEqual(lq2xq_1.lq2xq('title:"a phrase" t2'), `((title contains text "a phrase") OR (. contains text "t2"))`);
        });
    })().catch(test.ifError).then(test.done);
};
exports.range = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.throws(() => lq2xq_1.lq2xq(`{aida TO carmen}`), "range query on fields only");
            test.strictEqual(lq2xq_1.lq2xq(`title:{aida TO carmen}`), `(title>"aida" AND title<"carmen")`);
            test.strictEqual(lq2xq_1.lq2xq(`title:[aida TO carmen] token`), `((title>="aida" AND title<="carmen") OR (. contains text "token"))`);
            test.strictEqual(lq2xq_1.lq2xq(`title:[aida TO carmen] +token`), `(title>="aida" AND title<="carmen") AND (. contains text "token")`);
        });
    })().catch(test.ifError).then(test.done);
};
exports.wildcard = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.strictEqual(lq2xq_1.lq2xq(`test*`), `. contains text ("test.*" using wildcards)`);
            test.strictEqual(lq2xq_1.lq2xq(`title:test?d`), `(title contains text "test.d" using wildcards)`);
        });
    })().catch(test.ifError).then(test.done);
};
exports.proximity = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.strictEqual(lq2xq_1.lq2xq(`"i am"~2`), `. contains text ("i am" distance at most 2 words)`);
            test.strictEqual(lq2xq_1.lq2xq(`title:"i am"~2`), `(title contains text "i am" distance at most 2 words)`);
        });
    })().catch(test.ifError).then(test.done);
};
exports.fuzzy = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.throws(() => lq2xq_1.lq2xq(`token~0.9`), `Can't convert fuzzy search`);
            test.strictEqual(lq2xq_1.lq2xq(`token~0.9`, { similarityConverter: (similarity) => {
                    return `using option xhive:fuzzy "similarity=${similarity}"`;
                } }), '. contains text ("token" using option xhive:fuzzy "similarity=0.9")');
        });
    })().catch(test.ifError).then(test.done);
};
exports.modifiers = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.strictEqual(lq2xq_1.lq2xq(`t1 +t2 -t3 +t4`), `. contains text ("t2") ftand ("t4") ftand ftnot ("t3")`);
        });
    })().catch(test.ifError).then(test.done);
};
exports.fieldGroup = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.strictEqual(lq2xq_1.lq2xq("title:(+t2) title:(-t3)"), '(title contains text "t2") AND not(title contains text "t3")');
            test.strictEqual(lq2xq_1.lq2xq("title:(t1 +t2 -t3)"), '(title contains text "t2") AND not(title contains text "t3")');
            test.strictEqual(lq2xq_1.lq2xq("title:(+t2) title:(-t3) +ta -tb"), '(title contains text "t2") AND (. contains text "ta") AND' +
                ' not(title contains text "t3") AND not(. contains text "tb")');
        });
    })().catch(test.ifError).then(test.done);
};
exports.xpathField = (test) => {
    (function body() {
        return __awaiter(this, void 0, void 0, function* () {
            test.strictEqual(lq2xq_1.lq2xq("title:(+t2) //object_name:-name"), '(title contains text "t2") AND not(//object_name contains text "name")');
        });
    })().catch(test.ifError).then(test.done);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGxxMnhxLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGVzdGxxMnhxLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFFQSx3Q0FBbUM7QUFHbkMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQW1CO0lBQ25DLENBQUM7O1lBQ0MsTUFBTSxRQUFRLEdBQUcsd0JBQXdCLENBQUM7WUFDMUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDMUMsQ0FBQztLQUFBLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMzQyxDQUFDLENBQUE7QUFFRCxPQUFPLENBQUMsRUFBRSxHQUFHLENBQUMsSUFBbUI7SUFDL0IsQ0FBQzs7WUFDQyxNQUFNLFFBQVEsR0FBRyxzQ0FBc0MsQ0FBQztZQUN4RCxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMzQyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNoRCxDQUFDO0tBQUEsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzNDLENBQUMsQ0FBQTtBQUNELE9BQU8sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFtQjtJQUNoQyxDQUFDOztZQUNDLE1BQU0sUUFBUSxHQUFHLHVDQUF1QyxDQUFDO1lBQ3pELElBQUksQ0FBQyxXQUFXLENBQUMsYUFBSyxDQUFDLFdB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