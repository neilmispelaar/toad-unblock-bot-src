// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TextPrompt, ChoicePrompt, ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');
const { LuisRecognizer } = require('botbuilder-ai');

const STEP_5 = 'STEP_5';

const TEXT_PROMPT = 'TEXT_PROMPT';

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class Step5 extends ComponentDialog {
    constructor() {
        super(STEP_5);

        // Define a "done" response for the company selection prompt.
        this.doneOption = 'done';

        // Define value names for values tracked inside the dialogs.
        this.companiesSelected = 'value-companiesSelected';

        // Define the company choices for the company selection prompt.
        this.companyOptions = ['Adatum Corporation', 'Contoso Suites', 'Graphic Design Institute', 'Wide World Importers'];

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.notifyEmailStep.bind(this),
            this.testNotifyEmailStep.bind(this),
            this.emailStep.bind(this),
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async notifyEmailStep(step) {

        // We can send messages to the user at any point in the WaterfallStep.
        return await step.prompt(TEXT_PROMPT, 'What’s the best way to reach you? I can do email or text message (or both).');
    }

    async testNotifyEmailStep(step) {

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
            case 'confirmChoiceEmail':
                console.log("INTENT: ", intent)
                return await step.next();
                break;
            default: {
                console.log("END")
                return await step.replaceDialog(STEP_5, false);
            }
        }

    }

    async emailStep(step) {

        await step.context.sendActivity("Ok, we'll email you at person@domain.com  once we gotten your Record of Employment.");

        await step.context.sendActivity("That's all for now.");

        return await step.endDialog();

        // Running a prompt here means the next WaterfallStep will be run when the user's response is received.
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Before you go, could I ask you to rate the service you received today?',
            choices: ChoiceFactory.toChoices(['😡', '🙁', '😐', '🙂', '😄'])  
        });

        if (step.result) {
            // User said "yes" so we will be prompting for the next thing.
            // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
            console.log('Step data', step);
            
            step.values.type = step.result.value;

            if (step.values.type === 'Email') {

                await step.context.sendActivity("Ok, we'll email you at ___@____.com  once we gotten your Record of Employment.");

                // Running a prompt here means the next WaterfallStep will be run when the user's response is received.
                return await step.prompt(CHOICE_PROMPT, {
                    prompt: 'Before you go, could I ask you to rate the service you received today?',
                    choices: ChoiceFactory.toChoices(['😡', '🙁', '😐', '🙂', '😄'])  
                });

            }
            else {
                 // User said "no" so we will skip the next step. Give -1 as the age.
                return await step.endDialog();
            }
 

        } else {
            // User said "no" so we will skip the next step. Give -1 as the age.
            return await step.endDialog();
        }

    }


}

module.exports.Step5 = Step5;
module.exports.STEP_5 = STEP_5;
