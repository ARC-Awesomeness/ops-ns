/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([], function () {

    function pageInit(context) {
        try {
            var currentRec = context.currentRecord
            var fieldDepartments = currentRec.getField("custpage_departments");
            fieldDepartments.isDisplay = false;
            fieldDepartments.isVisible = false;
        } catch (error) {
            alert(JSON.stringify(error));
        }
    }

    function fieldChanged(context) {
        try {
            var currentRec = context.currentRecord;
            var fieldId = context.fieldId;
            if (fieldId == "custpage_locations") {
                var fieldLocations = currentRec.getValue(fieldId);
                var fieldDepartments = currentRec.getField("custpage_departments");
                if (fieldLocations != "") {
                    fieldDepartments.isDisplay = true;
                    fieldDepartments.isVisible = true;
                } else {
                    fieldDepartments.isDisplay = false;
                    fieldDepartments.isVisible = false;
                }
            }
        } catch (e) {
            alert(JSON.stringify(e));
        }
    }

    return {
        fieldChanged: fieldChanged,
        pageInit: pageInit,
    }
});
