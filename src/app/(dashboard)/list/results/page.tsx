export const dynamic = "force-dynamic";

import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import Image from "next/image";

type ResultList = {
  id: number;
  title: string;
  studentName: string;
  studentSurname: string;
  teacherName: string;
  teacherSurname: string;
  score: number;
  className: string;
  startTime: Date;
};

const ResultListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  // URL PARAMS CONDITION

  const query: Prisma.ResultWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "studentId":
            query.studentId = value;
            break;
          case "search":
            query.OR = [
              {
                exam: {
                  title: { contains: value, mode: "insensitive" },
                },
              },
              {
                assignment: {
                  title: { contains: value, mode: "insensitive" },
                },
              },
              {
                student: {
                  name: { contains: value, mode: "insensitive" },
                },
              },
            ];
            break;
          default:
            break;
        }
      }
    }
  }
  // Role condations
  switch (role) {
    case "admin":
      break;
    case "teacher":
      query.OR = [
        { exam: { lesson: { teacherId: userId! } } },
        { assignment: { lesson: { teacherId: userId! } } },
      ];
      break;
    case "student":
      query.studentId = userId!;
      break;
    case "parent":
      query.student = { parentId: userId! };
    default:
      break;
  }
  const [dataResponse, count] = await prisma.$transaction([
    prisma.result.findMany({
      where: query,
      include: {
        student: { select: { name: true, surname: true } },
        exam: {
          include: {
            lesson: {
              select: {
                class: { select: { name: true } },
                teacher: { select: { name: true, surname: true } },
              },
            },
          },
        },
        assignment: {
          include: {
            lesson: {
              select: {
                class: { select: { name: true } },
                teacher: { select: { name: true, surname: true } },
              },
            },
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: 10 * (p - 1),
    }),
    prisma.result.count({
      where: query,
    }),
  ]);

  const data = dataResponse.map((item) => {
    const assesment = item.exam || item.assignment;
    if (!assesment) return null;
    const isExam = "startTime" in assesment;
    return {
      id: item.id,
      title: assesment.title,
      studentName: item.student.name,
      studentSurname: item.student.surname,
      teacherName: assesment.lesson.teacher.name,
      teacherSurname: assesment.lesson.teacher.surname,
      score: item.score,
      className: assesment.lesson.class.name,
      startTime: isExam ? assesment.startTime : assesment.startDate,
    };
  });
  const columns = [
    {
      header: "Title",
      accessor: "name",
    },
    {
      header: "Student",
      accessor: "student",
    },
    {
      header: "Score",
      accessor: "score",
      className: "hidden md:table-cell",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Class",
      accessor: "class",
      className: "hidden md:table-cell",
    },
    {
      header: "Date",
      accessor: "date",
      className: "hidden md:table-cell",
    },
    ...(role === "admin" || role === "teacher"
      ? [
          {
            header: "Actions",
            accessor: "actions",
          },
        ]
      : []),
  ];

  const renderRow = (item: ResultList) => {
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight">
        <td className="flex items-center gap-4 p-4">
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.title}</h3>
          </div>
        </td>
        <td>{item.studentName + " " + item.studentSurname}</td>
        <td className="hidden md:table-cell">{item.score}</td>
        <td className="hidden md:table-cell">
          {item.teacherName + " " + item.teacherSurname}
        </td>
        <td className="hidden md:table-cell">{item.className}</td>
        <td className="hidden md:table-cell">
          {" "}
          {new Intl.DateTimeFormat("en-US").format(item.startTime)}
        </td>
        <td>
          <div className="flex items-center gap-2">
            {/* <Link href={`/list/teachers/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
                <Image src="/edit.png" alt="view icon" width={16} height={16} />
              </button>
            </Link> */}
            {role === "admin" ||
              (role === "teacher" && (
                // <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
                //   <Image
                //     src="/delete.png"
                //     alt="delete icon"
                //     width={16}
                //     height={16}
                //   />
                // </button>
                <>
                  <FormContainer
                    table="result"
                    type="update"
                    id={item.id}
                    data={item}
                  />
                  <FormContainer
                    data={""}
                    table="result"
                    type="delete"
                    id={item.id}
                  />
                </>
              ))}
          </div>
        </td>
      </tr>
    );
  };
  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Results</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image
                src="/filter.png"
                alt="filter icon"
                width={14}
                height={14}
              />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="sort icon" width={14} height={14} />
            </button>
            {role === "admin" ||
              (role === "teacher" && (
                // <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                //   <Image src="/plus.png" alt="plus icon" width={14} height={14} />
                // </button>
                <FormContainer data={""} table="result" type="create" />
              ))}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ResultListPage;
