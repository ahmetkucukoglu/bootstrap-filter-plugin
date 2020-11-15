var filterPlugin = (() => {

    var filtersOptions = null;
    var callbacksOptions = null;

    var formElements = {
        'text': {
            getText: (filter) => {

                var element = document.getElementsByName(filter.name)[0];

                if (!element.value)
                    return filter.label + ': ' + filter.defaultText;

                return filter.label + ': ' + element.value;
            },
            getValue: (filter) => {

                return document.getElementsByName(filter.name)[0].value;
            },
            clearValue: (filter) => {

                var element = document.getElementsByName(filter.name)[0];
                element.value = filter.defaultValue;
            }
        },
        'select-one': {
            getText: (filter) => {

                var element = document.getElementsByName(filter.name)[0];

                if (!element.value)
                    return filter.label + ': ' + filter.defaultText;

                return filter.label + ': ' + element.options[element.selectedIndex].text;
            },
            getValue: (filter) => {

                var element = document.getElementsByName(filter.name)[0];

                return element.value;
            },
            clearValue: (filter) => {

                var element = document.getElementsByName(filter.name)[0];

                if (element.selectedIndex)
                    element.selectedIndex = null;

                if (filter.defaultValue)
                    element.querySelector('option[value="' + filter.defaultValue + '"]').selected = true;
            }
        },
        'select-multiple': {
            getText: (filter) => {

                var element = document.getElementsByName(filter.name)[0];

                var result = '';

                Array.from(element.options).forEach((option) => {

                    if (option.selected)
                        result += option.text + ',';
                });

                if (!result)
                    result = filter.defaultText;
                else
                    result = result.substring(0, result.lastIndexOf(','));

                return filter.label + ': ' + result;
            },
            getValue: (filter) => {

                var element = document.getElementsByName(filter.name)[0];

                var result = [];

                Array.from(element.options).forEach((option) => {

                    if (option.selected)
                        result.push(option.value);
                });

                return result.length > 0 ? result : null;
            },
            clearValue: (filter) => {

                var element = document.getElementsByName(filter.name)[0];

                Array.from(element.options).forEach((option) => {

                    option.selected = false;

                    if (filter.defaultValue)
                        option.selected = filter.defaultValue.lastIndexOf(option.value) > -1;
                });
            }
        },
        'radio': {
            getText: (filter) => {

                var checkedRadio = document.querySelector('[name=' + filter.name + ']:checked');

                if (!checkedRadio)
                    return filter.label + ': ' + filter.defaultText;

                var selectedText = document.querySelector('label[for=' + checkedRadio.id + ']').textContent;

                return filter.label + ': ' + selectedText;
            },
            getValue: (filter) => {

                var checkedRadio = document.querySelector('[name=' + filter.name + ']:checked');

                if (!checkedRadio)
                    return filter.defaultValue;

                return checkedRadio.value;
            },
            clearValue: (filter) => {

                var radios = document.getElementsByName(filter.name);

                Array.from(radios).forEach((radio) => {

                    if (!radio.defaultValue)
                        radio.checked = false;
                    else
                        radio.checked = filter.defaultValue == radio.value;
                });
            }
        },
        'checkbox': {
            getText: (filter) => {

                var result = '';

                var checkboxes = document.getElementsByName(filter.name);

                Array.from(checkboxes).forEach((checkbox) => {

                    if (checkbox.checked) {

                        var selectedText = document.querySelector('label[for=' + checkbox.id + ']').textContent;

                        result += selectedText + ',';
                    }
                });

                if (!result)
                    result = filter.defaultText;
                else
                    result = result.substring(0, result.lastIndexOf(','));

                return filter.label + ': ' + result;
            },
            getValue: (filter) => {

                var result = [];

                var checkboxes = document.getElementsByName(filter.name);

                Array.from(checkboxes).forEach((checkbox) => {

                    if (checkbox.checked)
                        result.push(checkbox.value);
                });

                if (result.length == 0)
                    return filter.defaultValue;

                return result;
            },
            clearValue: (filter) => {

                var checkboxes = document.getElementsByName(filter.name);

                Array.from(checkboxes).forEach((checkbox) => {

                    if (!filter.defaultValue)
                        checkbox.checked = false;
                    else
                        checkbox.checked = filter.defaultValue.lastIndexOf(checkbox.value) > -1;
                });
            }
        }
    };

    function getFilterContainer(filterKey) {

        return document.querySelector('[data-filter-container=' + filterKey + ']');
    }

    function closeFilterContainer(filterKey) {

        getFilterContainer(filterKey).querySelector('[data-filter-close]').click();
    }

    function getActiveFilterContainer() {

        return document.querySelector('[data-filter-active][data-filter-container]');
    }

    function closeActiveFilterContainer() {

        var activeFilterContainer = getActiveFilterContainer();

        if (activeFilterContainer)
            activeFilterContainer.querySelector('[data-filter-close]').click();
    }

    function getFilterButton(filterKey) {

        return document.querySelector('[data-filter-button=' + filterKey + ']');
    }

    function getFilterStatus(filterKey) {

        return getFilterButton(filterKey).querySelector('[data-filter-status]');
    }

    function getFilterClearButton(filterKey) {

        return getFilterButton(filterKey).querySelector('[data-filter-clear]')
    }

    function clearFilter(filterKey) {

        getFilterClearButton(filterKey).click();
    }

    function getFilterResetButton() {

        return document.querySelector('[data-filter-reset]');
    }

    function getFilterApplyButton() {

        return document.querySelector('[data-filter-apply]');
    }

    function getFilterText(filter) {

        if (filter.getText)
            return filter.getText();

        return formElements[filter.type].getText(filter);
    }

    function getFilterValue(filter) {

        if (filter.getValue)
            return filter.getValue();

        return formElements[filter.type].getValue(filter);
    }

    function clearFilterValue(filter) {

        if (filter.clearValue) {

            filter.clearValue();
            return;
        }

        formElements[filter.type].clearValue(filter);
    }

    //PREPARING

    function prepareFilterType(filter) {

        var element = document.getElementsByName(filter.name)[0];

        filter.type = element.type;
    }

    function prepareFilterContainer(filterKey) {

        var filterContainer = getFilterContainer(filterKey);

        var filterCloseButton = document.createElement('button');
        filterCloseButton.type = 'button';
        filterCloseButton.classList.add('close');
        filterCloseButton.setAttribute('aria-label', 'Close');
        filterCloseButton.addEventListener('click', event => {

            var clickedFilterContainer = event.target.parentElement.parentElement;

            var filterKey = clickedFilterContainer.getAttribute('data-filter-container');

            var filterStatus = getFilterStatus(filterKey);
            filterStatus.textContent = getFilterText(filtersOptions[filterKey]);

            var filterClearButton = getFilterClearButton(filterKey);

            if (getFilterValue(filtersOptions[filterKey]))
                filterClearButton.classList.remove('d-none');
            else
                filterClearButton.classList.add('d-none');

            clickedFilterContainer.removeAttribute('data-filter-active');

            $(clickedFilterContainer).collapse('hide');
        });

        var filterCloseSpan = document.createElement('span');
        filterCloseSpan.setAttribute('data-filter-close', 'true');
        filterCloseSpan.setAttribute('aria-hidden', 'true');
        filterCloseSpan.innerHTML = '&times;';

        filterCloseButton.append(filterCloseSpan);

        filterContainer.prepend(filterCloseButton);
    }

    function prepareFilterButton(filterKey) {

        var filterStatusSpan = document.createElement('span');
        filterStatusSpan.setAttribute('data-filter-status', 'true');
        filterStatusSpan.textContent = getFilterText(filtersOptions[filterKey]);

        var clearFilterButton = document.createElement('button');
        clearFilterButton.type = 'button';
        clearFilterButton.style.zIndex = 9;
        clearFilterButton.setAttribute('data-filter-clear', 'true');
        clearFilterButton.setAttribute('aria-hidden', 'true');
        clearFilterButton.innerHTML = '&times;';
        clearFilterButton.addEventListener('click', event => {

            var filterKey = event.target.parentElement.getAttribute('data-filter-button');

            clearFilterValue(filtersOptions[filterKey]);

            closeFilterContainer(filterKey);

            event.stopPropagation();
        });

        if (!getFilterValue(filtersOptions[filterKey]))
            clearFilterButton.classList.add('d-none');

        var filterButton = getFilterButton(filterKey);
        filterButton.append(filterStatusSpan);
        filterButton.append(clearFilterButton);

        filterButton.addEventListener('click', event => {

            closeActiveFilterContainer();

            var filterButtonBound = event.currentTarget.getBoundingClientRect();

            var filterKey = event.currentTarget.getAttribute('data-filter-button');

            var clickedFilterContainer = getFilterContainer(filterKey);
            clickedFilterContainer.style.position = 'absolute';
            clickedFilterContainer.style.top = event.currentTarget.offsetTop + 'px';
            clickedFilterContainer.style.left = event.currentTarget.offsetLeft + 'px';
            clickedFilterContainer.style.minWidth = filterButtonBound.width + 'px';
            clickedFilterContainer.style.zIndex = 9;
            clickedFilterContainer.setAttribute('data-filter-active', 'true');

            $(clickedFilterContainer).collapse('show');

            event.stopPropagation();
        });
    }

    function bindEventToDocument() {

        document.addEventListener('click', event => {

            var activeFilterContainer = getActiveFilterContainer();

            if (activeFilterContainer) {

                var activeFilterContainerBound = activeFilterContainer.getBoundingClientRect();

                if (event.clientX < activeFilterContainerBound.left ||
                    event.clientX > activeFilterContainerBound.right ||
                    event.clientY < activeFilterContainerBound.top ||
                    event.clientY > activeFilterContainerBound.bottom) {

                    closeActiveFilterContainer();
                }
            }
        });
    }

    function bindEventToFilterResetButton() {

        var filterResetButton = getFilterResetButton();

        filterResetButton.addEventListener('click', event => {

            if (callbacksOptions && callbacksOptions.clickedFilterResetButton)
                callbacksOptions.clickedFilterResetButton();

            for (const filterKey in filtersOptions) {

                clearFilter(filterKey);
            }
        });
    }

    function bindEventToFilterApplyButton() {

        var filterApplyButton = getFilterApplyButton();

        filterApplyButton.addEventListener('click', event => {

            var result = {};

            for (const filterKey in filtersOptions) {

                var filter = filtersOptions[filterKey];

                if (getFilterValue(filter))
                    result[filterKey] = getFilterValue(filter);
            }

            callbacksOptions.clickedFilterApplyButton(result);

            event.preventDefault();
        });
    }

    return {

        initialize: (filters, callbacks) => {

            if (!filters) {

                console.log('Missing filters');

                return;
            }

            filtersOptions = filters;
            callbacksOptions = callbacks;

            bindEventToDocument();
            bindEventToFilterResetButton();

            if (callbacksOptions && callbacksOptions.clickedFilterApplyButton)
                bindEventToFilterApplyButton();

            for (const filterKey in filtersOptions) {

                var filter = filtersOptions[filterKey];

                if (!filter.getText)
                    prepareFilterType(filter);

                prepareFilterContainer(filterKey);
                prepareFilterButton(filterKey);
            }
        }
    };
})();
