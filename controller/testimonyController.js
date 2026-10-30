
import {
  createTestimony,
  getApprovedTestimonies,
  getPendingTestimonies,
  reviewTestimony,
} from "../service/testimonyService.js";

const createTestimonyController = async (req, res) => {
  const result = await createTestimony(req.body);

  return res.status(201).json({
    success: true,
    message: "Testimony submitted successfully and is awaiting review.",
    data: result,
  });
};

const listPublicTestimoniesController = async (req, res) => {
  const result = await getApprovedTestimonies({
    page: req.query.page,
    limit: req.query.limit,
  });

  return res.status(200).json({
    success: true,
    data: result.testimonies,
    pagination: result.pagination,
  });
};

const listPendingTestimoniesController = async (req, res) => {
  const result = await getPendingTestimonies({
    page: req.query.page,
    limit: req.query.limit,
  });

  return res.status(200).json({
    success: true,
    data: result.testimonies,
    pagination: result.pagination,
  });
};

const reviewTestimonyController = async (req, res) => {
  const { action } = req.body;

  const testimony = await reviewTestimony({
    testimonyId: req.params.id,
    action,
    reviewerId: req.user._id,
  });

  return res.status(200).json({
    success: true,
    message: `Testimony ${action === "approve" ? "approved" : "rejected"} successfully.`,
    data: testimony,
  });
};

export {
  createTestimonyController,
  listPublicTestimoniesController,
  listPendingTestimoniesController,
  reviewTestimonyController,
};
