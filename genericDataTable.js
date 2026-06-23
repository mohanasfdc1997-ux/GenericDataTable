import { LightningElement, api } from 'lwc';

import getRecords from '@salesforce/apex/DummyClass.getRecords';

import generateCSV from '@salesforce/apex/DummyClass.generateCSV';

import {updateRecord,deleteRecord} from 'lightning/uiRecordApi';

import {ShowToastEvent} from 'lightning/platformShowToastEvent';

const actions = [
    { label: 'Delete', name: 'delete' }
];
export default class GenericDataTable
extends LightningElement {

    @api objectApiName;
    @api parentFieldApiName;
    @api fieldList;
    @api searchableFields;
    @api recordId;
    @api pageSize = 10;
    @api columnConfig;
    @api targetObjectApiName;

    records = [];
    draftValues = [];

    pageNumber = 1;

    sortBy = 'Name';
    sortDirection = 'ASC';

    searchText = '';

    error;
    isLoading = false;

    get columns() {

        return this.columnConfig
            ? JSON.parse(this.columnConfig)
            : [];
    }

    connectedCallback() {
   console.log('recordId = ', this.recordId);
    console.log('targetObjectApiName = ', this.targetObjectApiName);
    console.log('fieldList = ', this.fieldList);
    console.log('parentFieldApiName = ', this.parentFieldApiName);
        this.loadRecords();
    }

    loadRecords() {

        this.isLoading = true;

        getRecords({

            objectApiName:
                this.objectApiName,

            fieldList:
                this.fieldList,

            parentFieldApiName:
                this.parentFieldApiName,

            parentId:
                this.recordId,

            sortBy:
                this.sortBy,

            sortDirection:
                this.sortDirection,

            pageSize:
                this.pageSize,

            pageNumber:
                this.pageNumber,

            searchText:
                this.searchText,

            searchableFields:
                this.searchableFields
        })

        .then(result => {

            this.records = result;
            this.error = undefined;
        })

        .catch(error => {

            this.error = error;

            this.records = [];
        })

        .finally(() => {

            this.isLoading = false;
        });
    }

    handleSort(event) {

        this.sortBy =
            event.detail.fieldName;

        this.sortDirection =
            event.detail.sortDirection;

        this.loadRecords();
    }

    handleSearch(event) {

        this.searchText =
            event.target.value;

        this.pageNumber = 1;

        this.loadRecords();
    }

    handleNext() {

        this.pageNumber++;

        this.loadRecords();
    }

    handlePrevious() {

        if(this.pageNumber > 1){

            this.pageNumber--;

            this.loadRecords();
        }
    }

    async handleSave(event) {

        const recordInputs =
            event.detail.draftValues.map(
                draft => ({
                    fields: {
                        ...draft
                    }
                })
            );

        try {

            await Promise.all(
                recordInputs.map(
                    record =>
                    updateRecord(record)
                )
            );
            this.showToast(
                'Success',
                'Records Updated',
                'success'
            );

            this.draftValues = [];

            await this.loadRecords();

        } catch(error){

            this.showToast(
                'Error',
                error.body.message,
                'error'
            );
        }
    }

    handleRowAction(event){

        const row =
            event.detail.row;

        const action =
            event.detail.action.name;

        if(action === 'delete'){

            deleteRecord(row.Id)

            .then(() => {

                this.showToast(
                    'Success',
                    'Record Deleted',
                    'success'
                );

                this.loadRecords();
            });
        }
    }

    exportCSV(){

        generateCSV({

            objectApiName:
                this.objectApiName,

            fieldList:
                this.fieldList
        })

        .then(csv => {

            const element =
                document.createElement(
                    'a'
                );

            element.href =
                'data:text/csv;charset=utf-8,' +
                encodeURIComponent(csv);

            element.download =
                this.objectApiName +
                '.csv';

            document.body
                .appendChild(element);

            element.click();
        });
    }

    showToast(
        title,
        message,
        variant
    ){

        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }

    get noRecords(){

        return !this.records ||
               this.records.length === 0;
    }

    get errorMessage(){

        return this.error
            ? this.error.body.message
            : '';
    }
}