// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TextPrompt, ChoicePrompt, ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');
const { LuisRecognizer } = require('botbuilder-ai');

const STEP_4 = 'STEP_4';

const TEXT_PROMPT = 'TEXT_PROMPT';

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class Step4 extends ComponentDialog {
    constructor() {
        super(STEP_4);

        // Define a "done" response for the company selection prompt.
        this.doneOption = 'done';

        // Define value names for values tracked inside the dialogs.
        this.companiesSelected = 'value-companiesSelected';

        // Define the company choices for the company selection prompt.
        this.companyOptions = ['Adatum Corporation', 'Contoso Suites', 'Graphic Design Institute', 'Wide World Importers'];

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.emailPromptStep.bind(this),
            this.testEmailProvidedStep.bind(this),
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }


    async emailPromptStep(step) {

        // We can send messages to the user at any point in the WaterfallStep.
        return await step.prompt(TEXT_PROMPT, 'Do you want me to notify you when we’ve received the Record of Employment?');
    
    }

    async testEmailProvidedStep(step) {

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

        console.log(intent);

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
                return await step.replaceDialog(STEP_4, false);
            }
        }
       
    }

}

module.exports.Step4 = Step4;
module.exports.STEP_4 = STEP_4;
