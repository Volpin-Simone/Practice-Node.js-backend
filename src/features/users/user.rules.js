

const USER_RULES =
{
    NAME:
    {
        MIN: 1,
        MAX: 25
    },

    PET:
    {
        MIN: 1,
        MAX: 25
    }
};

const PASSWORD_RULES =
{
    MIN: 8,
    MAX: 50
};



const isNotNumbersOnly = (value) =>         // this is reusable behavior for a rule that rejects a value that only consists of numbers
{
    return !/^\d+$/.test(value);
};



const containsNoNumbers = (value) =>        // this is reusable behavior for a rule that rejects a value that contains any amount of numbers
{
    return !/\d/.test(value);
};






export {
    USER_RULES,
    PASSWORD_RULES,
    isNotNumbersOnly,
    containsNoNumbers
};