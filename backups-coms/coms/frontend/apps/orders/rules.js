
const findItem = (item_id, $scope) => {
    for (let category of $scope.info.items) {

        for (let department of category.departments) {

            for (let type of ['selections', 'upgrades', 'options']) {

                for (let item of department[type]) {

                    if (item.id == item_id) {
                        return {category, department, item, type};
                    }
                }
            }
        }
    }
    return null;
};

export function applyRules(rules, item, special, $scope) {
    // Returns the list of undo_rules corresponding to the provided rules
    let undo_rules = [];
    for (let rule of rules) {

        switch (rule.type_code) {
            case 'ADD_EXTRAS':
                for (let rule_item of rule.items) {
                    // Find this item, and select it
                    let found_item = findItem(rule_item.id, $scope);
                    if (found_item !== null && found_item.type === 'options') {

                        let original_retail_price = found_item.item.retail_price;

                        // The item price is set to 0 as it will be calculated as part of the special including the rule.
                        if (special) {
                            found_item.item.retail_price = 0;
                            found_item.item.special_name = special.name;
                        }

                        let undo_rule = {
                            type_code: rule.type_code,
                            item: found_item.item,
                            item_original_retail_price: original_retail_price,
                            original_item: $scope.order.items[found_item.department.id],
                        };

                        undo_rules.push(undo_rule);

                        $scope.order.items[found_item.department.id] = found_item.item;
                    }
                }
                break;
            case 'MAKE_SELECTION':
                let selected_item = rule.selection.item;
                let found_item = findItem(selected_item.id, $scope);
                if (found_item !== null) {
                    undo_rules.push({
                        type_code: rule.type_code,
                        department: found_item.department,
                        original_item: $scope.order.items[found_item.department.id],
                    });
                    $scope.order.items[found_item.department.id] = found_item.item;
                    found_item.department.changed = true;
                }
                break;
            case 'PRICE_MULTIPLY':
                const multiply_items = $scope.priceMultiplyItems(rule.item, rule.items);
                item.price_multiply = multiply_items.totalQuantity;
                $scope.internal.price_multiplies.push(item);
                undo_rules.push({
                    type_code: rule.type_code,
                    item: item,
                    rule: rule,
                });
                break;

            // Is this still needed as of 09/08/2016 since now only the drafter can add special features?
            // To be discussed with PM
            // This should not be used. Keeping it here commented in case it's actually required later
            //case 'CUSTOMER_ENTRY':
            //{
            //    const found_item = findItem(item.id, $scope);
            //    category.special_features.push({
            //        notes: `${found_item.code} - ${found_item.name}: ${found_item.description}\n${rule.customer_entry}`,
            //        sku_category: null,
            //        quantity: 0,
            //        code: 'N/A',
            //        charge: 0.0
            //    });
            //    undo_rules.push({
            //        type_code: rule.type_code,
            //        item: item,
            //    });
            //    break;
            //}

            case 'MARK_PLAN':
                if (rule.file_upload) {
                    const progressKey = 'rule' + rule.id;
                    $scope.internal.file_uploads[progressKey] = {
                        name: rule.file_upload.name,
                        percentage: 0,
                    };
                    $scope.uploader.upload({
                        url: '/api/orders/rule-plan-upload',
                        data: {
                            order_id: $scope.order.id,
                            sku_id: item.id,
                            notes: rule.file_upload_notes,
                        },
                        file: rule.file_upload,
                    }).then(function (response) {
                        delete $scope.internal.file_uploads[progressKey];
                        undo_rules.push({
                            type_code: rule.type_code,
                            rule_plan_id: response.data.rule_plan_id,
                        });
                    }, function (resp) {
                        console.log('Error status: ' + resp.status);
                    }, function (evt) {
                        const progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                        $scope.internal.file_uploads[progressKey].percentage = progressPercentage;
                    });
                }
                break;
            case 'FORCE_SELECTION':
                for (let item of rule.items) {
                    // Find this item, and select it
                    let found_item = findItem(item.id, $scope);
                    undo_rules.push({
                        type_code: rule.type_code,
                        department: found_item.department,
                        original_item: $scope.order.items[found_item.department.id],
                    });
                    if (found_item !== null) {
                        $scope.order.items[found_item.department.id] = found_item.item;
                        found_item.department.changed = true;
                    }
                }
                break;
            case 'FORCE_UNSELECTION':
                for (let item of rule.items) {
                    // Find this item, and unselect it
                    let found_item = findItem(item.id, $scope);

                    if (found_item !== null) {
                        undo_rules.push({
                            type_code: rule.type_code,
                            department: found_item.department,
                            original_item: $scope.order.items[found_item.department.id],
                        });
                        delete $scope.order.items[found_item.department.id];
                        found_item.department.changed = true;
                    }
                }
                break;
        }

        rule.applied = true;
    }
    if (item) {
        item.undo_rules = undo_rules;
    }
    return undo_rules;
}


export function unapplyRules(undo_rules, $scope) {
    if (undo_rules === undefined) {
        return;
    }
    for (let undo of undo_rules) {
        switch (undo.type_code) {
            case 'ADD_EXTRAS':
                $scope.order.items[undo.item.sku_category] = undo.original_item;
                undo.item.retail_price = undo.item_original_retail_price;
                undo.item.special_name = undefined;
                break;
            case 'PRICE_MULTIPLY':
                delete undo.item.price_multiply;
                $scope.internal.price_multiplies = $scope.internal.price_multiplies.filter(x => x.id !== undo.item.id);
                break;
            // See applyRules
            //case 'CUSTOMER_ENTRY':
            //    delete undo.item.customer_entry;
            //    break;
            case 'MARK_PLAN':
                $scope.post('rule-plan-remove', {
                    rule_plan_id: undo.rule_plan_id,
                });
                break;
            case 'MAKE_SELECTION':
            case 'FORCE_SELECTION':
            case 'FORCE_UNSELECTION':
                $scope.order.items[undo.department.id] = undo.original_item;
                break;
        }
    }
}

// Filter the list of items associated with the rule type 'PRICE_MULTIPLY',
// to only those that have been selected
export function priceMultiplyItems(ruleItem, items, $scope) {
    let applicableItems = [],
        otherItems = [],
        totalPrice = 0,
        totalQuantity = 0;
    for (let item of items) {
        const foundItem = findItem(item.id, $scope);
        if (foundItem !== null && ($scope.order.items[found_item.department.id].id === item.id ||
            (foundItem.type === 'options' && $scope.order.items[found_item.department.id]))) {
            applicableItems.push(item);
            totalQuantity += item.quantity || 1;
            totalPrice += item.quantity * ruleItem.retail_price;
        } else {
            otherItems.push(item);
        }
    }
    return {applicableItems, otherItems, totalPrice, totalQuantity};
}

export function updatePriceMultiplies($scope) {
    if (!$scope.internal) {
        return;
    }

    for (let item of $scope.internal.price_multiplies) {
        let quantity = 0;
        for (let multiply_rule of item.undo_rules.filter(x => x.type_code === 'PRICE_MULTIPLY')) {
            const multiply_items = priceMultiplyItems(multiply_rule.rule.item, multiply_rule.rule.items, $scope);
            quantity += multiply_items.totalQuantity;
        }
        item.price_multiply = quantity;
    }
}

function allItemsSelected(items, $scope) {
    let all_satisfy = true;
    for (let item of items) {
        const found = findItem(item.id, $scope);
        if (found !== null && ($scope.order.items[found_item.department.id].id === item.id ||
            (found.type === 'options' && $scope.order.items[found_item.department.id]))) {
            // pass
        } else {
            all_satisfy = false;
            break;
        }
    }
    return all_satisfy;
}

export function applyShowSpecialRules($scope) {
    if (!$scope.hasAppliedShowSpecial()) {
        return;
    }
    let special = $scope.order.show_special;
    // Apply normal rules
    special.undo_rules = applyRules(special.rules, null, null, special, $scope);
}

export function updateShowSpecialValue($scope) {
    if (!$scope.hasAppliedShowSpecial()) {
        return;
    }
    let special = $scope.order.show_special;
    let value = 0;
    for (let rule of special.rules) {
        if (rule.type_code === 'PRICE_ADJUSTMENT') {
            // Only count this rule if all items are currently selected
            rule.applied = allItemsSelected(rule.items, $scope);
            if (rule.applied) {
                value += parseFloat(rule.price_adjustment || 0);
            }
        }
    }
    special.value = value;
}

export function updateRules($scope) {
    updatePriceMultiplies($scope);
}


