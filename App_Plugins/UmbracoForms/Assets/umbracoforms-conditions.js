﻿var umbracoForms = umbracoForms || {};
(function (uf) {
    var conditions = uf.conditions || {},
        operators = conditions.operators || {
            Is: function(value, expected) {
                return value === expected;
            },
            IsNot: function(value, unexpected) {
                return value !== unexpected;
            },
            GreaterThen: function(value, limit) {
                return parseInt(value) > parseInt(limit);
            },
            LessThen: function(value, limit) {
                return parseInt(value) < parseInt(limit);
            },
            StartsWith: function(value, criteria) {
                return value && value.indexOf(criteria) === 0;
            },
            EndsWith: function(value, criteria) {
                return value && value.indexOf(criteria) === value.length - criteria.length;
            },
            Contains: function(value, criteria) {
                return value && value.indexOf(criteria) > -1;
            }
        };

    uf.conditions = conditions;
    uf.conditions.operators = operators;

    conditions.handle = function (params) {
        var fsId,
            fieldId,
            fsConditions = params.fsConditions || {},
            fieldConditions = params.fieldConditions || {},
            values = params.values || {},
            cachedResults = {};

        function evaluateRuleInstance(rule) {
            var value = values[rule.field],
                func = operators[rule.operator],
                result = value !== null && func(value, rule.value);
            console.log(rule.field + ": " + value + " " + rule.operator + " " + rule.value + " = " + result + "\n");
            return result;
        }

        function evaluateRule(rule) {
            var dependencyIsVisible = true;

            if (fieldConditions[rule.field]) {
                dependencyIsVisible = isVisible(rule.field, fieldConditions[rule.field]);
            }

            if (dependencyIsVisible) {
                return evaluateRuleInstance(rule);
            } else {
                return false;
            }
        }

        function evaluateCondition(condition) {
            // This was once pretty. Now it needs refactoring again. :)

            var any = condition.logicType === "Any",
                all = condition.logicType === "All",
                fieldsetVisibilities = {},
                hasHiddenFieldset = false,
                success = true,
                rule,
                i;

            for (i = 0; i < condition.rules.length; i++) {
                rule = condition.rules[i];

                if (fieldsetVisibilities[rule.fieldset] !== undefined) {
                    continue;
                }

                if (fsConditions[rule.fieldset]) {
                    fieldsetVisibilities[rule.fieldset] = isVisible(rule.fieldset, fsConditions[rule.fieldset]);
                    if (!fieldsetVisibilities[rule.fieldset]) {
                        hasHiddenFieldset = true;
                    }
                } else {
                    fieldsetVisibilities[rule.fieldset] = true;
                }
            }

            if (all && hasHiddenFieldset) {
                return false;
            }

            for (i = 0; i < condition.rules.length; i++) {
                rule = condition.rules[i];

                console.log("looking up fs vis for " + rule.fieldset + " - " + fieldsetVisibilities[rule.fieldset] + "\n");

                if (fieldsetVisibilities[rule.fieldset]) {
                    success = evaluateRule(condition.rules[i]);
                } else {
                    success = false;
                }

                if (any && success) {
                    break;
                }
                if (all && !success) {
                    break;
                }
            }
            return success;
        }

        function evaluateConditionVisibility(id, condition) {
            var show = condition.actionType === "Show",
                cachedResult = cachedResults[id],
                success = cachedResult === undefined ?
                    evaluateCondition(condition) :
                    cachedResult,
                visible = !(success ^ show);
            return visible;
        }

        function isVisible(id, condition) {
            if (condition) {
                return evaluateConditionVisibility(id, condition);
            }
            return true;
        }

        function handleCondition(element, id, condition) {
            var shouldShow = isVisible(id, condition);
            if (shouldShow) {
                console.log("showing " + id + "\n");
                element.show();
            } else {
                console.log("hiding " + id + "\n");
                element.hide();
            }
        }

        for (fsId in fsConditions) {
            handleCondition($("#" + fsId), fsId, fsConditions[fsId]);
        }

        for (fieldId in fieldConditions) {
            handleCondition($("#" + fieldId).closest(".contourField"), fieldId, fieldConditions[fieldId]);
        }
    }

}(umbracoForms));