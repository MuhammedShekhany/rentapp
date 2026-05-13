import { NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET(req: Request) {

    try {

        const { searchParams } = new URL(req.url);

        const type = searchParams.get("type");

        const date = searchParams.get("date");
        const month = searchParams.get("month");
        const year = searchParams.get("year");

        let where = "";
        let params: any[] = [];

        // =========================
        // FILTER
        // =========================

        // CHECK FROM orders.or_date

        if (type === "daily" && date) {

            where = `WHERE DATE(o.or_date) = ?`;
            params.push(date);

        }

        if (type === "monthly" && month) {

            where = `WHERE DATE_FORMAT(o.or_date,'%Y-%m') = ?`;
            params.push(month);

        }

        if (type === "yearly" && year) {

            where = `WHERE YEAR(o.or_date) = ?`;
            params.push(year);

        }

        // =========================
        // QUERY
        // =========================

        const [rows]: any = await db.query(
            `
            SELECT

                g.pro_gat_id,
                g.pro_gat_name,

                p.pro_id,
                p.pro_name,
                p.pro_price,

                o.or_id,
                o.or_date,

                od.ord_price,
                od.ord_qt,
                od.ord_total

            FROM order_detail od

            INNER JOIN  \`order\` o
                ON o.or_id = od.or_id

            INNER JOIN product p
                ON p.pro_id = od.pro_id

            INNER JOIN pro_gat g
                ON g.pro_gat_id = p.pro_gat_id

            ${where}

            ORDER BY
                g.pro_gat_name ASC,
                o.or_id DESC
            `,
            params
        );

        // =========================
        // GROUPED
        // =========================

        const grouped: any = {};

        for (const item of rows) {

            // CREATE GROUP
            if (!grouped[item.pro_gat_id]) {

                grouped[item.pro_gat_id] = {

                    pro_gat_id: item.pro_gat_id,

                    pro_gat_name: item.pro_gat_name,

                    total: 0,

                    count: 0,

                    products: [],
                };

            }

            // PUSH PRODUCT
            grouped[item.pro_gat_id].products.push({

                pro_id: Number(item.pro_id),

                pro_name: item.pro_name,

                pro_price: Number(item.pro_price),

                or_id: Number(item.or_id),

                or_date: item.or_date,

                ord_price: Number(item.ord_price),

                total_qt: Number(item.ord_qt),

                total_amount: Number(item.ord_total),

                pro_gat_id: Number(item.pro_gat_id),

            });

            // TOTAL
            grouped[item.pro_gat_id].total +=
                Number(item.ord_total);

            // COUNT
            grouped[item.pro_gat_id].count += 1;

        }

        return NextResponse.json({

            success: true,

            data: Object.values(grouped),

        });

    } catch (error) {

        console.log(error);

        return NextResponse.json({

            success: false,

            message: "Server Error",

        });

    }
}