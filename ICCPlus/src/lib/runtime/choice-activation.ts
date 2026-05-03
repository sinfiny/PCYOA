import type { Choice, ExprNode, Requireds, Row, Score, SelectableAddon, Variable } from '$lib/store/types';
import type { LoadedCyoaRuntime } from './loaded-cyoa-runtime';

export type ChoiceActivationTarget = Choice | SelectableAddon;

export type ChoiceSelectionOptions = {
    countAsRowChoice?: boolean;
    activationMultiple?: number;
};

export type ActivationEvent = 'select' | 'deselect';

export type ActivationEffect =
    | { type: 'text-entry-prompt'; wordId?: string; prompt?: string; selectText?: string; deselectText?: string }
    | { type: 'image-upload-prompt'; choiceId: string; defaultImage?: string }
    | { type: 'scroll'; rowId?: string; choiceId?: string }
    | { type: 'fade-transition'; color?: string; time?: number; fadeInTime?: number; fadeOutTime?: number }
    | { type: 'bgm'; bgmId?: string; fadeIn?: boolean; fadeOut?: boolean; fadeInSec?: number; fadeOutSec?: number; noLoop?: boolean; mute?: boolean; useAudioURL?: boolean }
    | { type: 'sound-effect'; sfxId?: string; event: ActivationEvent };

export function selectChoice(
    runtime: LoadedCyoaRuntime,
    choice: ChoiceActivationTarget,
    row: Row,
    options: ChoiceSelectionOptions = {}
): void {
    const countAsRowChoice = options.countAsRowChoice ?? true;

    if (!choice.isActive && countAsRowChoice) {
        row.currentChoices += 1;
    }

    choice.isActive = true;
    runtime.setActivation(choice.id, { multiple: options.activationMultiple ?? 0 });
}

export function deselectChoice(
    runtime: LoadedCyoaRuntime,
    choice: ChoiceActivationTarget,
    row: Row,
    options: ChoiceSelectionOptions = {}
): void {
    const countAsRowChoice = options.countAsRowChoice ?? true;

    if (choice.isActive && countAsRowChoice) {
        row.currentChoices -= 1;
    }

    choice.isActive = false;
    runtime.deleteActivation(choice.id);
}

export function changeMultipleChoiceSelection(
    runtime: LoadedCyoaRuntime,
    choice: ChoiceActivationTarget,
    row: Row,
    delta: 1 | -1,
    options: ChoiceSelectionOptions = {}
): void {
    const countAsRowChoice = options.countAsRowChoice ?? true;
    const wasActive = choice.isActive;

    choice.multipleUseVariable += delta;

    if (choice.multipleUseVariable === 0) {
        choice.isActive = false;
        runtime.deleteActivation(choice.id);
        if (wasActive && countAsRowChoice) row.currentChoices -= 1;
        return;
    }

    choice.isActive = true;
    if (!wasActive && countAsRowChoice) row.currentChoices += 1;
    runtime.setActivation(choice.id, { multiple: choice.multipleUseVariable });
}

export function applyScoreSelection(runtime: LoadedCyoaRuntime, score: Score, value: number = getScoreValue(score)): number {
    const point = runtime.getPointType(score.id);
    if (typeof point === 'undefined') return 0;

    const appliedValue = point.allowFloat ? value : Math.floor(value);
    point.startingSum -= appliedValue;
    score.isActive = true;

    return appliedValue;
}

export function applyScoreDeselection(runtime: LoadedCyoaRuntime, score: Score, value: number = getScoreValue(score)): number {
    const point = runtime.getPointType(score.id);
    if (typeof point === 'undefined') return 0;

    const appliedValue = point.allowFloat ? value : Math.floor(value);
    point.startingSum += appliedValue;
    delete score.isActive;

    return appliedValue;
}

export function getScoreValue(score: Score): number {
    if (score.discountIsOn && score.appliedDiscount && typeof score.discountScore !== 'undefined') {
        return score.discountScore;
    }

    return score.value;
}

export function activateVariable(runtime: LoadedCyoaRuntime, variable: Variable): void {
    variable.isTrue = true;
    runtime.setActivation(variable.id, { multiple: 0, isVariable: true });
}

export function deactivateVariable(runtime: LoadedCyoaRuntime, variable: Variable): void {
    variable.isTrue = false;
    runtime.deleteActivation(variable.id);
}

export function activateRowButton(
    runtime: LoadedCyoaRuntime,
    row: Row,
    options: { randomPointTypeId?: string; pointNum?: number } = {}
): void {
    runtime.setActivation(row.id, {
        multiple: 0,
        isRowButton: true,
        rndPoint: options.randomPointTypeId,
        pointNum: options.pointNum
    });
}

export function collectActivationEffects(choice: ChoiceActivationTarget, event: ActivationEvent): ActivationEffect[] {
    const effects: ActivationEffect[] = [];

    if (choice.textfieldIsOn || choice.customTextfieldIsOn) {
        effects.push({
            type: 'text-entry-prompt',
            wordId: choice.idOfTheTextfieldWord,
            prompt: choice.wordPromptText,
            selectText: choice.wordChangeSelect,
            deselectText: choice.wordChangeDeselect
        });
    }

    if (choice.isImageUpload) {
        effects.push({ type: 'image-upload-prompt', choiceId: choice.id, defaultImage: choice.defaultImage });
    }

    if (choice.scrollToRow || choice.scrollToObject) {
        effects.push({ type: 'scroll', rowId: choice.scrollRowId, choiceId: choice.scrollObjectId });
    }

    if (choice.isFadeTransition) {
        effects.push({
            type: 'fade-transition',
            color: choice.fadeTransitionColor,
            time: choice.fadeTransitionTime,
            fadeInTime: choice.fadeInTransitionTime,
            fadeOutTime: choice.fadeOutTransitionTime
        });
    }

    if (choice.setBgmIsOn || choice.muteBgm) {
        effects.push({
            type: 'bgm',
            bgmId: choice.bgmId,
            fadeIn: choice.bgmFadeIn,
            fadeOut: choice.bgmFadeOut,
            fadeInSec: choice.bgmFadeInSec,
            fadeOutSec: choice.bgmFadeOutSec,
            noLoop: choice.bgmNoLoop,
            mute: choice.muteBgm,
            useAudioURL: choice.useAudioURL
        });
    }

    if (choice.useSfx && ((event === 'select' && choice.sfxOnSelect) || (event === 'deselect' && choice.sfxOnDeselect))) {
        effects.push({ type: 'sound-effect', sfxId: choice.sfxId, event });
    }

    return effects;
}

export function checkActivated(runtime: LoadedCyoaRuntime, id: string): boolean {
    const [key, val = '0'] = id.split('/ON#');
    const num = parseInt(val);

    if (num > 0) {
        const actNum = runtime.getActivation(key)?.multiple || 0;
        return actNum >= num;
    }

    return runtime.isActivated(key);
}

export function checkRequirement(runtime: LoadedCyoaRuntime, req: Requireds): boolean {
    if (req.required) {
        switch (req.type) {
            case 'id':
                return checkActivated(runtime, req.reqId);
            case 'points':
                return checkPointRequirement(runtime, req);
            case 'or':
                return checkOrRequirement(runtime, req);
            case 'pointCompare':
                return checkPointCompareRequirement(runtime, req);
            case 'selFromGroups':
                return checkSelectionFromGroupsRequirement(runtime, req);
            case 'selFromRows':
                return checkSelectionFromRowsRequirement(runtime, req);
            case 'selFromWhole':
                return checkSelectionFromWholeRequirement(runtime, req);
            case 'gid':
                return checkGlobalRequirement(runtime, req);
            case 'word':
                return checkWordRequirement(runtime, req);
        }
    } else {
        switch (req.type) {
            case 'id':
                return !checkActivated(runtime, req.reqId);
            case 'or':
                return checkNegativeOrRequirement(runtime, req);
            case 'gid':
                return !checkGlobalRequirement(runtime, req);
        }
    }

    return false;
}

export function checkRequirements(runtime: LoadedCyoaRuntime, requireds: Requireds[] = []): boolean {
    let result = true;

    for (let i = 0; i < requireds.length; i++) {
        const req = requireds[i];
        let subResult = true;

        if (typeof req.requireds !== 'undefined') {
            for (let j = 0; j < req.requireds.length; j++) {
                subResult = subResult && checkRequirement(runtime, req.requireds[j]);
            }
        }

        if (subResult) result = result && checkRequirement(runtime, req);
    }

    return result;
}

function checkPointRequirement(runtime: LoadedCyoaRuntime, req: Requireds): boolean {
    const pointData = runtime.getPointType(req.reqId);
    if (typeof pointData === 'undefined') return false;

    switch (req.operator) {
        case undefined:
        case '1':
            return pointData.startingSum > req.reqPoints;
        case '2':
            return pointData.startingSum >= req.reqPoints;
        case '3':
            return pointData.startingSum == req.reqPoints;
        case '4':
            return pointData.startingSum <= req.reqPoints;
        case '5':
            return pointData.startingSum < req.reqPoints;
        default:
            return false;
    }
}

function checkOrRequirement(runtime: LoadedCyoaRuntime, req: Requireds): boolean {
    const orNum = typeof req.orNum === 'undefined' ? 1 : req.orNum;
    let orCount = 0;

    if (req.orRequireds) {
        for (let i = 0; i < req.orRequireds.length; i++) {
            if (checkRequirement(runtime, req.orRequireds[i])) orCount++;
        }
    }

    return orCount >= orNum;
}

function checkNegativeOrRequirement(runtime: LoadedCyoaRuntime, req: Requireds): boolean {
    const orNum = typeof req.orNum === 'undefined' ? 1 : req.orNum;
    let orCount = 0;

    if (req.orRequireds) {
        for (let i = 0; i < req.orRequireds.length; i++) {
            if (checkRequirement(runtime, req.orRequireds[i])) orCount++;
        }
        return orCount < req.orRequireds.length - orNum + 1;
    }

    return false;
}

function checkGlobalRequirement(runtime: LoadedCyoaRuntime, req: Requireds): boolean {
    const globalReq = runtime.getGlobalRequirement(req.reqId);
    if (typeof globalReq !== 'undefined') {
        return checkRequirements(runtime, globalReq.requireds);
    }

    return false;
}

function checkWordRequirement(runtime: LoadedCyoaRuntime, req: Requireds): boolean {
    const word = runtime.getWord(req.reqId);
    if (typeof word === 'undefined') return false;

    let orCount = 0;
    for (let i = 0; i < req.orRequired.length; i++) {
        const orReq = req.orRequired[i].req;
        if (typeof orReq !== 'undefined' && word.replaceText === orReq) orCount++;
    }

    return orCount >= 1;
}

function checkSelectionFromGroupsRequirement(runtime: LoadedCyoaRuntime, req: Requireds): boolean {
    if (!req.selGroups) return false;

    let count = 0;
    const selFromOperators = typeof req.selFromOperators === 'undefined' ? '1' : req.selFromOperators;
    const selNum = typeof req.selNum === 'undefined' ? 1 : req.selNum;

    for (let i = 0; i < req.selGroups.length; i++) {
        const data = runtime.getGroup(req.selGroups[i]);
        if (typeof data !== 'undefined') {
            const groupElements = data.elements;
            for (let j = 0; j < groupElements.length; j++) {
                if (runtime.isActivated(groupElements[j])) count++;
            }
        }
    }

    return compareSelectionCount(selFromOperators, selNum, count);
}

function checkSelectionFromRowsRequirement(runtime: LoadedCyoaRuntime, req: Requireds): boolean {
    if (!req.selRows) return false;

    let count = 0;
    const selFromOperators = typeof req.selFromOperators === 'undefined' ? '1' : req.selFromOperators;
    const selNum = typeof req.selNum === 'undefined' ? 1 : req.selNum;

    for (let i = 0; i < req.selRows.length; i++) {
        const data = runtime.getRow(req.selRows[i]);
        if (typeof data !== 'undefined') {
            count += data.currentChoices;
        }
    }

    return compareSelectionCount(selFromOperators, selNum, count);
}

function checkSelectionFromWholeRequirement(runtime: LoadedCyoaRuntime, req: Requireds): boolean {
    let count = 0;
    const selFromOperators = typeof req.selFromOperators === 'undefined' ? '1' : req.selFromOperators;
    const selNum = typeof req.selNum === 'undefined' ? 1 : req.selNum;

    for (const row of runtime.getRows()) {
        count += row.currentChoices;
    }

    return compareSelectionCount(selFromOperators, selNum, count);
}

function compareSelectionCount(operator: string, expected: number, actual: number): boolean {
    switch (operator) {
        case '1':
            return !(expected > actual || (expected === 0 && actual > 0));
        case '2':
            return expected === actual;
        case '3':
            return !(expected < actual || (expected === 0 && actual > 0));
        default:
            return false;
    }
}

function checkPointCompareRequirement(runtime: LoadedCyoaRuntime, req: Requireds): boolean {
    const point1 = runtime.getPointType(req.reqId);
    const point2 = runtime.getPointType(req.reqId1);
    if (typeof point1 === 'undefined' || typeof point2 === 'undefined') return false;

    let current: number | ExprNode = point2.startingSum;

    if (req.more) {
        for (let i = 0; i < req.more.length; i++) {
            let temp = 0;
            const item = req.more[i];
            const operator = item.operator || '1';
            const priority = getPriority(operator, item.priority);
            if (item.id) {
                const moreData = runtime.getPointType(item.id);
                if (typeof moreData !== 'undefined') {
                    temp = moreData.startingSum;
                }
            } else if (typeof item.points !== 'undefined') {
                temp = item.points;
            }

            const node: ExprNode = { left: current, operator, right: temp, priority };

            if (typeof current !== 'number' && priority < current.priority) {
                current = {
                    left: current.left,
                    operator: current.operator,
                    right: { left: current.right, operator, right: temp, priority },
                    priority: current.priority
                };
            } else {
                current = node;
            }
        }
    }

    const result = evaluateNode(current);

    switch (req.operator) {
        case '1':
            return point1.startingSum > result;
        case '2':
            return point1.startingSum >= result;
        case '3':
            return point1.startingSum == result;
        case '4':
            return point1.startingSum <= result;
        case '5':
            return point1.startingSum < result;
        default:
            return false;
    }
}

function getPriority(operator: string, priority: number = 1) {
    switch (operator) {
        case '5':
        case '4':
        case '3':
            return priority * 10 + 1;
        case '2':
        case '1':
        default:
            return priority * 10 + 2;
    }
}

function evaluateNode(node: number | string | ExprNode): number {
    if (typeof node === 'number') return node;
    if (typeof node === 'string') return Number(node);

    const left = evaluateNode(node.left);
    const right = evaluateNode(node.right);

    switch (node.operator) {
        case '1':
            return left + right;
        case '2':
            return left - right;
        case '3':
            return left * right;
        case '4':
            return right !== 0 ? left / right : left;
        case '5':
            return right !== 0 ? left % right : left;
        default:
            return left;
    }
}
