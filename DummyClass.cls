public With Sharing class DummyClass {

    @AuraEnabled(cacheable=true)
    public static List<SObject> getRecords(
        String objectApiName,
        String fieldList,
        String parentFieldApiName,
        Id parentId,
        String sortBy,
        String sortDirection,
        Integer pageSize,
        Integer pageNumber,
        String searchText,
        String searchableFields
    ) {

        Integer offsetValue = (pageNumber - 1) * pageSize;

        String query =
            'SELECT ' + fieldList +
            ' FROM ' + objectApiName;

        List<String> whereConditions = new List<String>();

        if(String.isNotBlank(parentFieldApiName) && parentId != null){
            whereConditions.add(parentFieldApiName + ' = :parentId');
        }

        if(String.isNotBlank(searchText) &&
           String.isNotBlank(searchableFields)){

            List<String> fields =
                searchableFields.split(',');

            List<String> searchConditions =
                new List<String>();

            for(String fieldName : fields){

                searchConditions.add(
                    fieldName.trim() +
                    ' LIKE \'%' +
                    String.escapeSingleQuotes(searchText) +
                    '%\''
                );
            }

            whereConditions.add(
                '(' +
                String.join(
                    searchConditions,
                    ' OR '
                ) +
                ')'
            );
        }

        if(!whereConditions.isEmpty()){
            query +=
                ' WHERE ' +
                String.join(
                    whereConditions,
                    ' AND '
                );
        }

        query +=
            ' ORDER BY ' +
            sortBy +
            ' ' +
            sortDirection;

        query +=
            ' LIMIT ' +
            pageSize;

        query +=
            ' OFFSET ' +
            offsetValue;
 System.debug('Query ==> ' + query);
        return Database.query(query);
    }

    @AuraEnabled
    public static String generateCSV(
        String objectApiName,
        String fieldList
    ){

        String query =
            'SELECT ' +
            fieldList +
            ' FROM ' +
            objectApiName;

        List<SObject> records = Database.query(query);

        List<String> csvRows = new List<String>();

        csvRows.add(fieldList);

        List<String> fields = fieldList.split(',');

        for(SObject record : records){

            List<String> values = new List<String>();

            for(String fieldName : fields){

                Object value =
                    record.get(
                        fieldName.trim()
                    );

                values.add(
                    value == null
                    ? ''
                    : '"' +
                      String.valueOf(value) +
                      '"'
                );
            }

            csvRows.add(
                String.join(
                    values,
                    ','));
        }
 System.debug('csvRows ==> ' + csvRows);
        return String.join(
            csvRows,
            '\n'
        );
    }
}