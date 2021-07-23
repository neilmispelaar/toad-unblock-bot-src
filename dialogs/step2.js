// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TextPrompt, ChoicePrompt, ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');
const { LuisRecognizer } = require('botbuilder-ai');

const STEP_2 = 'STEP_2';

const TEXT_PROMPT = 'TEXT_PROMPT';

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class Step2 extends ComponentDialog {
    constructor() {
        super(STEP_2);

        // Define a "done" response for the company selection prompt.
        this.doneOption = 'done';

        // Define value names for values tracked inside the dialogs.
        this.companiesSelected = 'value-companiesSelected';

        // Define the company choices for the company selection prompt.
        this.companyOptions = ['Adatum Corporation', 'Contoso Suites', 'Graphic Design Institute', 'Wide World Importers'];

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.intentConfirmStep.bind(this),
            this.testintentConfirmStep.bind(this),
            this.selectionStep.bind(this),
            this.loopStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async intentConfirmStep(step) {

         // We can send messages to the user at any point in the WaterfallStep.
         await step.context.sendActivity('So, I can see that you completed your application on February 12, and the application itself looks good. However, we still haven’t received a Record of Employment from your previous employer, Initech.');

          // We can send messages to the user at any point in the WaterfallStep.
        return await step.prompt(TEXT_PROMPT, 'If you like, I can send Initech a follow-up email from the Government of Canada. That usually does the trick 😉');
    
    }

    async testintentConfirmStep(step) {

        //console.log('Step:', step);

        //await step.context.sendActivity(`Checking LUIS... ${step.result}`);

        const recognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: `https://${ process.env.LuisAPIHostName }.api.cognitive.microsoft.com`
        }, {
            includeAllIntents: true,
            includeInstanceData: true
        }, true);

        // Call prompts recognizer
        const recognizerResult = await recognizer.recognize(step.context);

        // Top intent tell us which cognitive service to use.
        const intent = LuisRecognizer.topIntent(recognizerResult);

        switch(intent) {
            // Proceed
            case 'confirmChoicePositive':
                console.log("INTENT: ", intent)
                return await step.endDialog(true);
                break;
            case 'confirmChoiceNegative':
                console.log("INTENT: ", intent)
                return await step.endDialog(false);
                break;
            default: {
                // Catch all 
                console.log("END");
                return await step.replaceDialog(STEP_2, false);
            }
        }
       
    }

    async selectionStep(stepContext) {
        // Continue using the same selection list, if any, from the previous iteration of this dialog.
        const list = Array.isArray(stepContext.options) ? stepContext.options : [];
        stepContext.values[this.companiesSelected] = list;

        // Create a prompt message.
        let message = '';
        if (list.length === 0) {
            message = `Please choose a company to review, or \`${ this.doneOption }\` to finish.`;
        } else {
            message = `You have selected **${ list[0] }**. You can review an additional company, or choose \`${ this.doneOption }\` to finish.`;
        }

        // Create the list of options to choose from.
        const options = list.length > 0
            ? this.companyOptions.filter(function(item) { return item !== list[0]; })
            : this.companyOptions.slice();
        options.push(this.doneOption);

        // Prompt the user for a choice.
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: message,
            retryPrompt: 'Please choose an option from the list.',
            choices: options
        });
    }

    async loopStep(stepContext) {
        // Retrieve their selection list, the choice they made, and whether they chose to finish.
        const list = stepContext.values[this.companiesSelected];
        const choice = stepContext.result;
        const done = choice.value === this.doneOption;

        if (!done) {
            // If they chose a company, add it to the list.
            list.push(choice.value);
        }

        if (done || list.length > 1) {
            // If they're done, exit and return their list.
            return await stepContext.endDialog(list);
        } else {
            // Otherwise, repeat this dialog, passing in the list from this iteration.
            return await stepContext.replaceDialog(REVIEW_SELECTION_DIALOG, list);
        }
    }
}

module.exports.Step2 = Step2;
module.exports.STEP_2 = STEP_2;
