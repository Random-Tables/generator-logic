# generator-logic
Background logic for building indexes &amp; returning data


### TDD

`npm run test`

## Glossary

`Collection` - Thematically linked collection of tables, this provides the root index called, these id's should be unique   
`TableSet` - A subset of a Collection for sub categorisation    
`Table` - A single table that when called will return a random value


## buildIndex - function

[ARGS] arrayOfTableIndexes[Array], onComplete[function]

Pass this an Array of Collections and it will build the index, once complete it will fire the onComplete function.
if run a second time will reset the buildindex to only those Collections provided

## appendIndex

[ARGS] arrayOfTableIndexes[Object], onComplete[function]

Same as buildIndex, but just passing a single Object and adds non destructively

## getCall

[ARGS] tableCallString[string] - should match pattern `collectionID/tableSet/table`

Returns below object based on call provided

```
{
	data?: [ (field used for non-utility tables)
        {
            title: [string] (table item title)
            data: [string] (actual table data)
            class?: [string] (css class)
            icon?: [string] (url/data for icon image)
            iconclass?: [string] (css class for icon)
        },
        ...
    ];
	utility?: [string] (field used if requesting a utility table)
	type?: [string] (currently unused futureproofing for increasing flexibility)
    missingLib: [bool] (returns true if a required library is missing)
	call: [string] ()
}
```
