import _ from 'lodash';

export default app => {
    app.factory('ScheduleReferenceDataService', () => {
        class ScheduleReferenceData {
            constructor() {
                this.initialized = false;

                this.buildPrioritiesLookup = undefined;
                this.buildPriorities = undefined;
                this.coilTypes = undefined;
                this.productionChecklists = undefined;
                this.qualityChecklists = undefined;
                this.notesChecklists = undefined;
            }

            setReferenceData(data) {
                // this data shouldn't change
                if (this.initialized) return;

                this.buildPriorities = data.buildPriorities;
                this.buildPrioritiesLookup = _.keyBy(this.buildPriorities, 'priorityId');
                this.coilTypes = data.coilTypes;
                this.productionChecklists = data.productionChecklists;
                this.qualityChecklists = data.qualityChecklists;
                this.notesChecklists = data.notesChecklists;
            }
        }

        return new ScheduleReferenceData();
    });
}