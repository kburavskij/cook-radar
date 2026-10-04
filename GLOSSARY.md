# Cook Radar

Cook Radar helps a person choose recipes from their pantry. This vocabulary keeps imported recipes, pantry stock, and shopping items talking about the same food.

## Ingredients and quantities

**Ingredient**:
A food or cooking product used by a recipe, such as garlic, flour, or olive oil.
_Avoid_: Food item when referring to a recipe component.

**Canonical ingredient**:
The shared product concept used for matching, such as `Garlic` for "garlic cloves" and "clove of garlic".
_Avoid_: Source name, display name.

**Ingredient key**:
The stable name for a canonical ingredient. It connects recipe ingredients with the same pantry and shopping product even when their wording differs.
_Avoid_: Raw name, label.

**Source ingredient**:
The wording copied from a recipe website before it is cleaned up. It can include a brand, variety, package wording, or preparation instruction.
_Avoid_: Canonical ingredient.

**Preparation note**:
An instruction about the state or preparation of an ingredient, such as "chopped", "drained", or "rinsed". It does not change the product identity.
_Avoid_: Ingredient name.

**Count kind**:
The meaning of one counted piece, such as a clove, can, fillet, or whole item. It prevents different kinds of pieces from being treated as interchangeable.
_Avoid_: Generic piece, unit.

**Known quantity**:
A recipe amount that the importer can interpret as a number. "To taste", "as needed", a pinch, and a dash remain ingredients but do not have a reliable numeric amount.
_Avoid_: Missing ingredient.

**Measurement unit**:
The unit attached to a quantity. Cook Radar uses grams for mass, millilitres for volume, and a semantic count kind when a recipe counts pieces.
_Avoid_: Format, measure type.

## Pantry and planning

**Pantry item**:
A quantity of a canonical ingredient that the person has at home.
_Avoid_: Inventory food, available ingredient.

**Shopping item**:
A quantity of a canonical ingredient that still needs to be bought. It may come from one recipe or several recipes.
_Avoid_: Shopping ingredient, missing product.

**Missing ingredient**:
The part of a recipe that the pantry cannot cover with a compatible product, unit, and quantity.
_Avoid_: Unavailable food.
