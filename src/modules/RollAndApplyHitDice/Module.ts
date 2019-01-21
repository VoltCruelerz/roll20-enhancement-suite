import { R20Module } from "../../utils/R20Module";
import { R20 } from "../../utils/R20";
import { DOM } from "../../utils/DOM";
import { findByIdAndRemove } from "../../utils/MiscUtils";
import { TokenContextMenu } from "../../utils/TokenContextMenu";
import SayCallback = R20.SayCallback;
import {CanvasObject, Character} from "roll20";
import {Optional} from "../../utils/TypescriptUtils";

class RollAndApplyHitDiceModule extends R20Module.SimpleBase {
    public constructor() {
        super(__dirname);
    }

    private static fancySay(msg: string, callback?: SayCallback) {
        R20.sayToSelf(`&{template:default} {{name=R20ES Hit Dice}} {{${msg}}}`, callback);
    }

    private reportNoCharacter = () => {
        RollAndApplyHitDiceModule.fancySay("Token doesn't have a character.");
    };

    private tryGetCharacter(obj: CanvasObject): Optional<Character> {
        if(obj.model && obj.model.character) {
            return obj.model.character;
        }
        return;
    }

    private setHealth = (token: CanvasObject, health: number) => {
        const config = this.getHook().config;

        let barValue = config.bar + "_value";
        let barMax = config.bar + "_max";
        let save = {};
        save[barValue] = health;
        save[barMax] = health;
        token.model.save(save);
    };

    private onClickMenuItem = (e) => {

        const objects = R20.getSelectedTokens();
        const config = this.getHook().config;

        // tokens will locally disappear if we do not unselect them here
        R20.unselectTokens();

        let numRolled = 0;

        if(!config.diceFormulaMacro) {

            for (let token of objects) {

                const char = this.tryGetCharacter(token);
                if(!char) {
                    this.reportNoCharacter();
                    continue;
                }

                const attribs = char.attribs;

                // find hpForumla
                let hpFormula = null;
                for (let attrib of attribs.models) {
                    if (!hpFormula && attrib.attributes.name === config.diceFormulaAttribute) {
                        hpFormula = attrib.attributes.current;
                        break;
                    }
                }

                if (!hpFormula) {
                    RollAndApplyHitDiceModule.fancySay(`Could not find attribute ${config.diceFormulaAttribute}`);
                    continue;
                }

                RollAndApplyHitDiceModule.fancySay(`${token.model.character.get("name")}: [[${hpFormula}]]`,
                    (_, o) => {
                        if (!o.inlinerolls || o.inlinerolls.length <= 0) return;

                        let hp = o.inlinerolls[0].results.total;

                        this.setHealth(token, hp);

                        // reselect when we're done processing all callbacks.
                        numRolled++;
                        if (numRolled >= objects.length) {
                            for (let sel of objects) {
                                R20.addTokenToSelection(sel);
                            }
                        }
                    });
            }
        } else {
            const cbGen = (token: CanvasObject) => {
                const char = this.tryGetCharacter(token);
                if(!char) {
                    this.reportNoCharacter();
                    return;
                }

                const id = R20.generateUUID();
                const callback = (_, o) => {
                    let sum = 0;

                    if(!o.inlinerolls) {
                        return;
                    }

                    for (const roll of o.inlinerolls) {
                        if(!roll || !roll.results || !roll.results.total) continue;

                        sum += roll.results.total;
                    }

                    console.log(sum, o);
                    this.setHealth(token, sum);
                };

                return {
                    id,
                    callback
                }
            };

            R20.doBulkRoll(objects, config.diceFormulaMacro, 0, false, cbGen);
        }
    };

    public setup() {
        if(!R20.isGM()) return;

        TokenContextMenu.addButton("Hit Dice", this.onClickMenuItem, {
            mustHaveSelection: true
        });
    }

    public dispose() {
        TokenContextMenu.removeButton("Hit Dice", this.onClickMenuItem);
    }
}

if (R20Module.canInstall()) new RollAndApplyHitDiceModule().install();