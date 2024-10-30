
import Count from "./models/Count";


export const getAffigenProductsCount = async () => {
    try {
        const counts = await Count.findOne({name: 'products'})
        if (!counts) {
            return {count: 0}
        }
        const affigen = counts.affigen
        return {count: affigen}
    } catch (error) {
        return {count: 0}
    }
  };
export const getGentaurProductsCount = async () => {
    try {
        const counts = await Count.findOne({name: 'products'})
        if (!counts) {
            return {count: 0}
        }
        const affigen = counts.gentaur
        return {count: affigen}
    } catch (error) {
        return {count: 0}
    }
  };
