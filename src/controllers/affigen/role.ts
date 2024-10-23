
import { Request, Response, NextFunction } from 'express';
import Role, { IRole } from '../../models/affigen/Role';
import { createError } from '../../error';


export const getAllRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const roles: IRole[] | [] = await Role.find();
        res.status(200).json(roles);
    } catch (error) {
        next(createError(404, 'no roles found!'));
    }
};
