// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, ChoiceFactory, ChoicePrompt, DialogSet, DialogTurnStatus, WaterfallDialog } = require('botbuilder-dialogs');
const { TopLevelDialog, TOP_LEVEL_DIALOG } = require('./topLevelDialog');

const MAIN_DIALOG = 'MAIN_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

const CHOICE_PROMPT = 'CHOICE_PROMPT';

class MainDialog extends ComponentDialog {
    constructor(userState) {
        super(MAIN_DIALOG);
        this.userState = userState;
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);


        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

        this.addDialog(new TopLevelDialog());
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.initialStep.bind(this),
            this.finalRateStep.bind(this),
            this.finalStep.bind(this),
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async initialStep(stepContext) {
        return await stepContext.beginDialog(TOP_LEVEL_DIALOG);
    }

    async finalRateStep(stepContext) {
        
        // Running a prompt here means the next WaterfallStep will be run when the user's response is received.
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: 'Before you go, could I ask you to rate the service you received today? 😡 🙁 😐 🙂 😄',
            choices: ChoiceFactory.toChoices(['😡', '🙁', '😐', '🙂', '😄'])  
        });

    }

    async finalStep(stepContext) {

        await stepContext.context.sendActivity('Ok, have a great day!');

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is the end.
        return await stepContext.endDialog();
    }


}

module.exports.MainDialog = MainDialog;
module.exports.MAIN_DIALOG = MAIN_DIALOG;
