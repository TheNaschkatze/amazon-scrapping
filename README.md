#amazon-scrapping
Amazon scrapping is a simple package that search for an item in amazon.de and retrieves:
+ title: string
+ url: string
+ price: string
+ average of reviews: string
+ number of reviews: string

The response is an array of JSO with the above attributes.
##how it works
After installing use the function scrappeOnAmazon.

It takes 3 parameters:
+ product: the prodcut to be searched. Must be a string.
+ numberOfSearchPages: How deep you want to search for the item. Is the number of times the script click on nextpage when searching. Must be a number greater than 0.
+ numberOfSimultaneousPDP: How many tabs are going to be used simultaneously to search for the item. Must be a number greater than 0.

