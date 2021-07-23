// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, ChoicePrompt, NumberPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { Step1, STEP_1 } = require('./step1');
const { Step2, STEP_2 } = require('./step2');
const { Step3, STEP_3 } = require('./step3');
const { Step4, STEP_4 } = require('./step4');
const { Step5, STEP_5 } = require('./step5');
const { UserProfile } = require('../userProfile');

const TOP_LEVEL_DIALOG = 'TOP_LEVEL_DIALOG';

const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';


class TopLevelDialog extends ComponentDialog {
    constructor() {
        super(TOP_LEVEL_DIALOG);
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));

        this.addDialog(new Step1());
        this.addDialog(new Step2());
        this.addDialog(new Step3());
        this.addDialog(new Step4());
        this.addDialog(new Step5());

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.step1.bind(this),
            this.step1confirm.bind(this),
            this.step2.bind(this),
            this.step2confirm.bind(this),
            this.step3.bind(this),
            this.step4.bind(this),
            this.step4confirm.bind(this),
            this.step5.bind(this),
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async step1(stepContext) {
        
        return await stepContext.beginDialog(STEP_1);

    }

    async step1confirm(stepContext) {
        // Set the user's name to what they entered in response to the name prompt.
        //stepContext.values.userInfo.name = stepContext.result;

        console.log('Step Result', stepContext.result)

        // User wants to end
        if (stepContext.result === false) { 
            return await stepContext.endDialog(false);
        }
        else { 
            return await stepContext.next();
        }

    }

    async step2(stepContext) {
        
        return await stepContext.beginDialog(STEP_2);

    }

    async step2confirm(stepContext) {
        // Set the user's name to what they entered in response to the name prompt.
        //stepContext.values.userInfo.name = stepContext.result;

        console.log('Step Result', stepContext.result)

        // User wants to end
        if (stepContext.result === false) { 

            await stepContext.context.sendActivity("No problemo!");

            return await stepContext.endDialog(false);
        }
        else { 
            return await stepContext.next();
        }

    }

    async step3(stepContext) {
        
        return await stepContext.beginDialog(STEP_3);

    }

    async step3confirm(stepContext) {
        // Set the user's name to what they entered in response to the name prompt.
        //stepContext.values.userInfo.name = stepContext.result;

        console.log('Step Result Step 3 confirm', stepContext.result)

        // User wants to be contacted
        if (stepContext.result === true) { 

            return await stepContext.next();
        }
        // User does not want to be contacted
        else { 

            await stepContext.context.sendActivity("Sounds good, that's all for now then.");

            return await stepContext.endDialog();
        }

    }

    async step4(stepContext) {
        
        return await stepContext.beginDialog(STEP_4);

    }

    async step4confirm(stepContext) {
        // Set the user's name to what they entered in response to the name prompt.
        //stepContext.values.userInfo.name = stepContext.result;

        console.log('Step Result', stepContext.result)

        // User wants to end
        if (stepContext.result === true) { 

            return await stepContext.next();
        }
        else { 

            await stepContext.context.sendActivity("Sounds good, that's all for now then.");

            return await stepContext.endDialog();
        }

    }

    async step5(stepContext) {
        
        return await stepContext.beginDialog(STEP_5);

    }

  



    async startSelectionStep(stepContext) {
        // Set the user's age to what they entered in response to the age prompt.
        stepContext.values.userInfo.age = stepContext.result;

        if (stepContext.result < 25) {
            // If they are too young, skip the review selection dialog, and pass an empty list to the next step.
            await stepContext.context.sendActivity('You must be 25 or older to participate.');

            return await stepContext.next();
        } else {
            // Otherwise, start the review selection dialog.
            return await stepContext.beginDialog(REVIEW_SELECTION_DIALOG);
        }
    }

    async acknowledgementStep(stepContext) {
        // Set the user's company selection to what they entered in the review-selection dialog.
        const userProfile = stepContext.values.userInfo;
        userProfile.companiesToReview = stepContext.result || [];

        await stepContext.context.sendActivity(`Thanks for participating ${ userProfile.name }`);

        // Exit the dialog, returning the collected user information.
        return await stepContext.endDialog(userProfile);
    }
}

module.exports.TopLevelDialog = TopLevelDialog;
module.exports.TOP_LEVEL_DIALOG = TOP_LEVEL_DIALOG;
