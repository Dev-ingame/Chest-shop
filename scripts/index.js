import {
    world,
    BlockPermutation,
    BlockComponentTypes,
    Container,
    Player,
    EntityComponentTypes,
    ItemStack,
    ItemType,
} from "@minecraft/server";

const overWorld = world.getDimension("overworld");

function placeTranslatedSign(location, text) {
    const signBlock = location.dimension.getBlock(location);

    if (!signBlock) {
        console.warn("Could not find a block at specified location.");
        return;
    }
    const signPerm = BlockPermutation.resolve("minecraft:standing_sign", {
        ground_sign_direction: 8,
    });
    signBlock.setPermutation(signPerm);

    const signComponent = signBlock.getComponent(BlockComponentTypes.Sign);
    if (signComponent) {
        signComponent.setText({
            with: [text],
        });
    } else {
        console.error("Could not find a sign component on the block.");
    }
}
placeTranslatedSign(
    {
        dimension: world.getDimension("overworld"),
        x: 0,
        y: 63,
        z: 0,
    },
    "Steve"
);

/**
 *
 * @param {import("@minecraft/server").DimensionLocation} location
 * @returns {Container}
 */
function checkChest(location, itemToCheck) {
    const items = [];
    const chestLocation = overWorld.getBlock(location);

    const localize = "minecraft:" + itemToCheck;

    // console.warn(itemToCheck)

    if (chestLocation.isAir) return null;
    const component = chestLocation.getComponent("inventory");
    /**
     * @type {Container}
     */
    const container = component.container;

    for (let i = 0; i < container.size; i++) {
        if (
            container.getItem(i) === undefined ||
            container.getItem(i) === null
        ) {
            continue;
        }

        if (container.getItem(i).typeId === localize) {
            // console.warn("true");
            items.push(i);
        }
    }

    return { chestLocation, items };
}

/**
 *
 * @param {number} slotId
 * @param {Container} fromContainer
 * @param {Player} toPlayer
 */
function Transaction(slotId, fromContainer, toPlayer, amount) {
    /**
     * @type {Container}
     */
    const fromInventory = fromContainer.getComponent(
        EntityComponentTypes.Inventory
    );
    /**
     * @type {Container}
     */
    const toInventory = toPlayer.getComponent(EntityComponentTypes.Inventory);

    const itemType = fromInventory.container.getItem(slotId).typeId;
    const itemCount = fromInventory.container.getItem(slotId).amount;

    if (
        fromInventory &&
        toInventory &&
        fromInventory.container &&
        toInventory.container
    ) {
        console.warn(JSON.stringify(fromInventory.container.getItem(slotId)));

        console.warn(itemCount);

        if (itemCount <= 1 || amount > itemCount) {
            console.warn("ContainerSlot is 1 or less");
            overWorld.runCommandAsync(
                `give "${toPlayer.name}" ${itemType} ${itemCount}`
            );
            return fromInventory.container.setItem(
                slotId,
                new ItemStack("minecraft:air")
            );
        } else {
            overWorld.runCommandAsync(
                `give "${toPlayer.name}" ${itemType} ${amount}`
            );
            return fromInventory.container.setItem(
                slotId,
                new ItemStack(itemType, itemCount - amount)
            );
        }
    }
}

world.afterEvents.entityHitBlock.subscribe((ev) => {
    const block = ev.hitBlock;
    const player = ev.damagingEntity;
    // console.warn(JSON.stringify(block.permutation.matches("wall_sign")))
    // console.warn(JSON.stringify(block.permutation.type))
    if (!block.permutation.matches("wall_sign")) return 0;
    if (block.south().typeId === "minecraft:air") return 0;
    const text = block.getComponent(BlockComponentTypes.Sign).getText();
    const args = text.split(/\n/);
    const name = args[0];
    const amount = args[1];
    const part = args[2].split(" ");
    const transactionType = part[0];
    const transactionCost = part[1];
    const itemType = args[3];

    const { chestLocation, items } = checkChest(
        block.south(),
        itemType.toLowerCase()
    );

    if (items.length === 0) return 0;
    console.warn("True");
    Transaction(items[0], chestLocation, player, amount);

    console.warn(JSON.stringify(items));
    console.warn(
        `\nname: ${name}\namount: ${amount}\nTType: ${transactionType}\nTCost: ${transactionCost}\nIType: ${itemType}`
    );
});
